package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.TeacherUser;
import com.lindyhopseoul.backend.admin.TeacherUserRepository;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LessonNoticeService {

    private static final int MAX_CONTENT_LENGTH = 2000;

    private final LessonRepository lessonRepository;
    private final LessonNoticeRepository lessonNoticeRepository;
    private final LessonNoticeReadStateRepository lessonNoticeReadStateRepository;
    private final EventApplicationRepository eventApplicationRepository;
    private final TeacherUserRepository teacherUserRepository;

    public LessonNoticeService(
            LessonRepository lessonRepository,
            LessonNoticeRepository lessonNoticeRepository,
            LessonNoticeReadStateRepository lessonNoticeReadStateRepository,
            EventApplicationRepository eventApplicationRepository,
            TeacherUserRepository teacherUserRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.lessonNoticeRepository = lessonNoticeRepository;
        this.lessonNoticeReadStateRepository = lessonNoticeReadStateRepository;
        this.eventApplicationRepository = eventApplicationRepository;
        this.teacherUserRepository = teacherUserRepository;
    }

    public List<LessonNoticeResponse> findAdminNotices(AdminPrincipal actor, Long lessonId) {
        Lesson lesson = findLesson(lessonId);
        requireLessonNoticeManager(actor, lesson);
        return findNoticeResponses(lessonId);
    }

    @Transactional
    public LessonNoticeResponse createAdminNotice(
            AdminPrincipal actor,
            Long lessonId,
            LessonNoticeCreateRequest request
    ) {
        Lesson lesson = findLesson(lessonId);
        requireLessonNoticeManager(actor, lesson);

        AuthorSnapshot authorSnapshot = authorSnapshot(actor);
        LessonNotice notice = LessonNotice.create(
                lesson,
                normalizeContent(request.content()),
                actor.userCd(),
                authorSnapshot.nickname(),
                authorSnapshot.displayName()
        );
        return LessonNoticeResponse.from(lessonNoticeRepository.save(notice));
    }

    public List<LessonNoticeResponse> findMemberNotices(Member member, Long lessonId) {
        Lesson lesson = findLesson(lessonId);
        requireMemberLessonAccess(member, lesson);
        return findNoticeResponses(lessonId);
    }

    @Transactional
    public void markMemberNoticesRead(Member member, Long lessonId) {
        Lesson lesson = findLesson(lessonId);
        requireMemberLessonAccess(member, lesson);
        Instant readAt = Instant.now();
        lessonNoticeReadStateRepository.findByLesson_IdAndMember_Id(lesson.getId(), member.getId())
                .ifPresentOrElse(
                        readState -> readState.markRead(readAt),
                        () -> lessonNoticeReadStateRepository.save(LessonNoticeReadState.create(lesson, member, readAt))
                );
    }

    public LessonNoticeUnreadCountResponse findMemberUnreadCount(Member member) {
        List<Lesson> appliedLessons = eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(member.getId())
                .stream()
                .map(EventApplication::getLesson)
                .filter(lesson -> lesson != null && lesson.getId() != null)
                .collect(java.util.stream.Collectors.toMap(
                        Lesson::getId,
                        lesson -> lesson,
                        (left, right) -> left,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .toList();
        if (appliedLessons.isEmpty()) {
            return new LessonNoticeUnreadCountResponse(0);
        }

        List<Long> lessonIds = appliedLessons.stream()
                .map(Lesson::getId)
                .toList();
        Map<Long, Instant> latestNoticeCreatedAtByLessonId = new LinkedHashMap<>();
        lessonNoticeRepository.findLatestCandidatesByLessonIds(lessonIds)
                .forEach(notice -> latestNoticeCreatedAtByLessonId.putIfAbsent(
                        notice.getLesson().getId(),
                        notice.getCreatedAt()
                ));
        if (latestNoticeCreatedAtByLessonId.isEmpty()) {
            return new LessonNoticeUnreadCountResponse(0);
        }

        Map<Long, Instant> lastReadAtByLessonId = new LinkedHashMap<>();
        lessonNoticeReadStateRepository.findByMember_IdAndLesson_IdIn(member.getId(), lessonIds)
                .forEach(readState -> lastReadAtByLessonId.put(
                        readState.getLesson().getId(),
                        readState.getLastReadAt()
                ));

        long unreadLessonCount = latestNoticeCreatedAtByLessonId.entrySet()
                .stream()
                .filter(entry -> {
                    Instant lastReadAt = lastReadAtByLessonId.get(entry.getKey());
                    return lastReadAt == null || entry.getValue().isAfter(lastReadAt);
                })
                .count();
        return new LessonNoticeUnreadCountResponse(unreadLessonCount);
    }

    private List<LessonNoticeResponse> findNoticeResponses(Long lessonId) {
        return lessonNoticeRepository.findByLesson_IdOrderByCreatedAtAscIdAsc(lessonId)
                .stream()
                .map(LessonNoticeResponse::from)
                .toList();
    }

    private Lesson findLesson(Long lessonId) {
        return lessonRepository.findDetailsById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
    }

    private void requireLessonNoticeManager(AdminPrincipal actor, Lesson lesson) {
        if (actor.canManageEvents()) {
            return;
        }
        if (!actor.hasRole(AdminRole.TEACHER)) {
            throw new ForbiddenException("This account cannot manage lesson notices.");
        }

        Optional<TeacherUser> teacherUser = teacherUserRepository
                .findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(actor.userCd(), "Y");
        boolean isAssignedTeacher = teacherUser
                .map(teacher -> isLessonTeacher(lesson, teacher.getTeacherUserCd()))
                .orElse(false);
        if (!isAssignedTeacher) {
            throw new ForbiddenException("Teachers can manage notices only for their assigned lessons.");
        }
    }

    private boolean isLessonTeacher(Lesson lesson, String teacherUserId) {
        return lesson.getTeachers()
                .stream()
                .anyMatch(lessonTeacher -> lessonTeacher.getTeacherUser().getTeacherUserCd().equals(teacherUserId));
    }

    private void requireMemberLessonAccess(Member member, Lesson lesson) {
        long activeApplicationCount = eventApplicationRepository.countByMemberIdAndApplicationTarget(
                member.getId(),
                lesson.getEvent().getId(),
                lesson.getId()
        );
        if (activeApplicationCount < 1) {
            throw new ForbiddenException("This lesson notice is available only to applied members.");
        }
    }

    private String normalizeContent(String content) {
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isBlank()) {
            throw new ConflictException("Notice content is required.");
        }
        if (normalizedContent.length() > MAX_CONTENT_LENGTH) {
            throw new ConflictException("Notice content must be 2000 characters or less.");
        }
        return normalizedContent;
    }

    private AuthorSnapshot authorSnapshot(AdminPrincipal actor) {
        String displayName = cleanNullable(actor.userNm());
        String nickname = teacherUserRepository
                .findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(actor.userCd(), "Y")
                .map(TeacherUser::getTeacherUserNm)
                .map(this::cleanNullable)
                .orElse(null);
        if (displayName == null) {
            displayName = nickname;
        }
        return new AuthorSnapshot(nickname, displayName);
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private record AuthorSnapshot(
            String nickname,
            String displayName
    ) {
    }
}
