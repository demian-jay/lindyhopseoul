import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import AdminApp from "./AdminApp";
import { isAdminHost } from "./adminHost";
import CorkboardPage from "./CorkboardPage";
import useModalBackDismiss from "./useModalBackDismiss";
import { hasBeenAskedToInstall, promptInstall, rememberInstallAsked, useInstallState } from "./installPrompt";
// Landing-page section slideshows: every jpg in the folder, sorted by filename.
// Drop numbered files into the folder to add/reorder slides.
const sortedGlob = (modules) =>
  Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([path, src]) => ({ src, name: path.split("/").pop() }));

// Section 2 (스윙댄스 소개)
const swingIntroPhotos = sortedGlob(
  import.meta.glob("./assets/gallery/swing-intro/*.jpg", { eager: true, import: "default" })
);
// Section 3 (스윙팝의 스윙댄스)
const swingpopStylePhotos = sortedGlob(
  import.meta.glob("./assets/gallery/swingpop-style/*.jpg", { eager: true, import: "default" })
);
import { authApi } from "./api/auth";
import { memoApi } from "./api/memos";
import { publicScheduleApi } from "./api/publicSchedules";

const CONTENT = {
  ko: {
    nav: ["스윙팝", "스윙댄스", "스윙팝의 춤", "서울 씬", "일정 및 신청"],
    heroBadge: "SwingPop Community",
    heroTitle: "스윙댄스로 연결되는 커뮤니티, 스윙팝",
    heroDesc:
      "춤은 사람을 연결하고, 음악은 그 시간을 특별하게 만듭니다.\nSwingPop은 한국인과 외국인이 자발적으로 함께 만들어가는 스윙댄스 커뮤니티입니다.\n음악과 춤을 통해 새로운 사람들을 만나고, 함께 배우며 성장하는 즐거움을 함께하세요.",
    heroPrimary: "일정 보고 신청하기",
    heroSecondary: "커뮤니티 소개 보기",
    heroCorkboard: "담벼락",
    mobileApply: "일정 보고 신청하기",
    languageTitle: "언어를 선택해주세요",
    languageDesc: "Choose your preferred language to continue.",
    visitorGuide: {
      eyebrow: "처음 오시는 분",
      title: "장소 및 공지방 안내",
      description: "처음 방문하시거나 수업 장소, 공지방, 문의 방법이 필요하신 분들은 아래 내용을 확인해주세요.",
      panels: [
        {
          id: "firstVisit",
          title: "처음 오신다면",
          summary: "신발, 참가비, KP 댄스홀 입구 안내를 미리 확인해주세요.",
        },
        {
          id: "location",
          title: "수업 장소",
          summary: "KP 댄스홀과 Dialogue 지도 링크를 확인할 수 있습니다.",
        },
        {
          id: "announcement",
          title: "공지방",
          summary: "수업 전 안내와 최신 소식을 확인할 수 있습니다.",
        },
        {
          id: "contact",
          title: "문의하기",
          summary: "궁금한 점은 카카오톡 또는 인스타그램 DM으로 문의해주세요.",
        },
      ],
      firstVisit: {
        items: [
          {
            id: "shoes",
            title: "실내용 신발",
            body: "댄스홀에 입장할 때는 외부 신발을 신을 수 없습니다. 댄스홀에 비치된 신발을 이용할 수 있지만, 맞는 사이즈가 없을 수 있으니 가능하면 편한 실내용 신발을 가져와 주세요.",
          },
          {
            id: "payment",
            title: "현금 또는 계좌이체",
            body: "Swingpop은 비즈니스가 아니라 운영진과 강사들의 봉사로 운영되는 커뮤니티입니다. 카드 결제 장비가 없으므로 참가비는 현금 또는 계좌이체로 준비해주세요. 계좌이체는 KAKAOBANK 3333-37-3073172 정대혁 계좌로 보내주시면 됩니다.",
          },
          {
            id: "entrance",
            title: "KP 댄스홀 뒷문",
            body: "KP 댄스홀의 정문은 이른 시간에 잠기는 경우가 있습니다. 아래 “뒷문으로 오는 길” 사진을 확인하고 뒷문으로 입장해주세요.",
          },
        ],
        backEntranceButton: "뒷문으로 오는 길 보기",
      },
      announcement: {
        intro: "수업 전 안내와 최신 소식은 카카오톡 공지방에서 확인할 수 있습니다.",
      },
      contact: {
        intro: "궁금한 점이 있다면 카카오톡 또는 인스타그램 DM으로 문의해주세요.",
        kakaoTalk: "KakaoTalk",
        instagram: "인스타그램 DM",
      },
      location: {
        intro: "수업에 오시기 전 장소별 지도 링크와 안내를 확인해주세요.",
        googleMaps: "Google Maps",
        naverMap: "Naver Map",
        backEntranceButton: "뒷문으로 오는 길 보기",
        backEntranceCloseButton: "뒷문 안내 접기",
      },
    },
    application: {
      scheduleEyebrow: "Schedule",
      applyEyebrow: "Apply",
      filtersTitle: "신청 가능한 일정",
      filters: [
        { id: "all", label: "전체" },
        { id: "beginner", label: "처음 추천" },
        { id: "regular", label: "정규수업" },
        { id: "workshop", label: "워크샵" },
        { id: "social", label: "다이얼로그 모임" },
        { id: "event", label: "특별 이벤트" },
      ],
      recommended: "처음 추천",
      scheduleButton: "일정으로 이동",
      applyButton: "신청하기",
      appliedButton: "신청 완료",
      details: {
        date: "날짜",
        time: "시간",
        location: "장소",
        price: "가격",
        teacher: "강사",
        event: "이벤트",
      },
      noResults: "선택한 조건에 맞는 일정이 없습니다.",
      loading: "등록된 일정과 강습을 불러오는 중입니다.",
      empty: "현재 신청 가능한 공개 일정이 없습니다.",
      loadError: "등록된 일정과 강습을 불러오지 못했습니다.",
      free: "무료",
      toBeAnnounced: "추후 안내",
      paymentNote: "현장에서 현금 또는 계좌이체로 결제해주세요. 계좌이체는 KAKAOBANK 3333-37-3073172 정대혁 계좌로 보내주시면 됩니다.",
      entranceFeeNote: "입장료 10,000원은 별도입니다.",
      levelNotice: "Level 2 이상 수업은 권장 경험 기준이 있습니다. 신청 시 수강 기준을 확인해주세요.",
      viewClasses: "클래스 선택",
      classCountLabel: (count) => `클래스 ${count}개`,
      selectClassTitle: "클래스 선택",
      selectClassIntro: "신청할 클래스를 선택해주세요.",
      closeModal: "닫기",
    },
    applicationModal: {
      title: "신청 정보 입력",
      close: "닫기",
      nameLabel: "닉네임/이름",
      namePlaceholder: "예: 홍길동 또는 스윙 닉네임",
      nameHelp: [
        "한국의 스윙댄스/린디합 문화에서는 인터넷 커뮤니티를 통해 활성화된 배경이 있어 닉네임을 사용하는 문화가 있습니다. 이름이나 닉네임 중 편한 것을 자유롭게 입력해주세요.",
      ],
      nameManagedBySettings: "로그인 회원의 이름은 내 설정 정보로 자동 입력됩니다.",
      requestMemoLabel: "질문사항 / 하고 싶은 말",
      requestMemoPlaceholder: "수업 전에 궁금한 점이나 운영진에게 전달하고 싶은 말을 적어주세요.",
      requestMemoHelp:
        "질문에 대한 답변을 받고 싶으신 경우, 이메일, 연락처, 카카오톡 ID 등 답변받을 수 있는 정보를 함께 적어주세요.",
      danceRoleLabel: "역할",
      danceRolePlaceholder: "역할을 선택해주세요",
      danceRoles: {
        LEADER: "리더",
        FOLLOWER: "팔로워",
        BOTH: "리더/팔로워 모두 가능",
      },
      danceRoleGuide: [
        "리더(Lead) 👉 같이 추는 사람에게 “다음에 뭐 할지” 알려주는 사람",
        "팔로워(Follow) 👉 리더가 보내는 신호를 받아서 함께 춤을 만들어가는 사람",
        "둘 다 가능하다면 “리더/팔로워 모두 가능”을 선택해주세요.",
        "일반적으로 남성이 리더 역할을 맡고 여성이 팔로워 역할을 하지만, 성별에 상관없이 누구나 역할을 맡을 수 있습니다.",
      ],
      contactMethods: {
        PHONE: "전화번호",
        KAKAO_TALK: "카카오톡 ID",
        WHATSAPP: "WhatsApp",
        INSTAGRAM: "Instagram ID",
        EMAIL: "이메일",
      },
      contactPlaceholders: {
        PHONE: "예: 010-1234-5678",
        KAKAO_TALK: "예: swingpop_kakao",
        WHATSAPP: "예: +82 10 1234 5678",
        INSTAGRAM: "예: swingpop_seoul",
        EMAIL: "예: hello@example.com",
      },
      submit: "신청하기",
      submitting: "신청 중",
      required: "닉네임/이름을 입력해주세요.",
      danceRoleRequired: "역할을 선택해주세요.",
      submitError: "신청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      alreadyAppliedError: "이미 신청된 수업입니다.",
      successTitle: "신청이 접수되었습니다.",
      noticeTitle: "공지방 안내",
      noticeBody: "수업 전 안내와 최신 소식은 공지방에서 확인해주세요.",
      announcementRoom: "카카오톡 공지방",
      contactTitle: "문의 방법",
      contactBody: "궁금한 점이 있다면 아래로 문의해주세요.",
      kakaoTalk: "KakaoTalk",
      koreanContact: "Korean: pethromuse",
      englishContact: "English: maelahreeh",
      instagramDm: "Instagram DM",
      announcementQuestion: "카카오톡 공지방에서도 질문할 수 있습니다.",
      mapTitle: "수업 장소 확인하기",
      googleMaps: "Google Maps",
      naverMap: "Naver Map",
      chooseAnother: "수업 등록 완료",
    },
    sections: [
      {
        id: "about",
        eyebrow: "1. 스윙팝 소개",
        title: "스윙팝은 어떤 커뮤니티인가요?",
        body: [
          "스윙팝은 춤을 잘 추는 사람만을 위한 공간이 아니라, 다양한 배경의 사람들이 함께 어울리고 연결되는 커뮤니티를 지향합니다.",
          "한국인과 외국인이 자연스럽게 섞여 춤추고 대화하며, 처음 방문한 사람도 부담 없이 참여할 수 있는 따뜻하고 열린 분위기를 중요하게 생각합니다.",
        ],
        stats: [
          { label: "분위기", value: "Welcoming" },
          { label: "커뮤니티", value: "International" },
          { label: "경험", value: "Beginner Friendly" },
        ],
      },
      {
        id: "swing",
        eyebrow: "2. 스윙댄스 소개",
        title: "스윙댄스는 무엇인가요?",
        body: [
          "스윙댄스는 1920~30년대 미국의 재즈 문화 속에서 시작되어 오늘날까지 전 세계 사람들이 함께 즐기고 있는 소셜댄스입니다. 파트너와 호흡을 맞추며 자유롭게 리듬을 즐기고, 다양한 사람들과 춤을 나누는 것이 가장 큰 특징입니다.",
          "스윙댄스에서는 실력보다 함께 춤추고 소통하는 즐거움을 중요하게 생각합니다. 음악 한 곡이 끝날 때마다 새로운 사람과 춤을 추며 자연스럽게 사람들을 만나고, 국적과 언어를 넘어 서로 연결될 수 있다는 점이 스윙댄스의 가장 큰 매력입니다.",
        ],
        points: ["재즈와 함께하는 리듬감", "사람과 연결되는 소셜댄스", "초보자도 시작 가능한 구조"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. 스윙팝의 스윙댄스",
        title: "스윙팝에서는 어떤 경험을 할 수 있나요",
        body: [
          "스윙팝에서는 수업을 통해 기본기를 배우고, 이어지는 소셜댄스 시간에는 다양한 사람들과 자유롭게 춤추며 배운 내용을 자연스럽게 익혀갑니다. 춤을 처음 배우는 사람도 부담 없이 여러 사람과 춤을 추며 음악과 소셜댄스의 즐거움을 경험할 수 있습니다.",
          "우리는 춤을 잘 추는 것보다 함께 인사하고, 서로를 존중하며, 음악을 즐기는 분위기를 더 중요하게 생각합니다. 한국인과 외국인이 함께 어울리며 새로운 사람들을 만나고, 누구나 편안하게 참여할 수 있는 커뮤니티를 만들어가고 있습니다.",
        ],
        cards: [
          {
            title: "Class",
            desc: "기초부터 차근차근 배우며 부담 없이 시작할 수 있습니다.",
          },
          {
            title: "Social Dance",
            desc: "여러 사람과 춤추며 실제 스윙댄스의 재미를 경험합니다.",
          },
          {
            title: "Community",
            desc: "춤뿐 아니라 대화와 교류를 통해 자연스럽게 연결됩니다.",
          },
        ],
      },
      {
        id: "seoul-scene",
        eyebrow: "4. 서울 스윙댄스 씬 소개",
        title: "서울에서 스윙댄스를 즐긴다는 것",
        body: [
          "서울에는 오랫동안 이어져 온 활발한 스윙댄스 문화가 있으며, 다양한 댄스홀과 행사, 소셜 파티를 통해 여러 스타일과 사람들을 만날 수 있습니다.",
          "처음에는 하나의 커뮤니티에서 시작하더라도, 점차 서울 전체의 스윙 씬을 경험하며 더 넓은 세계를 발견하는 즐거움이 있습니다.",
        ],
        highlight: "서울은 스윙댄스를 배우고 즐기기에 매력적인 도시이며, 스윙팝은 그 입구가 되어줄 수 있습니다.",
      },
      {
        id: "schedule",
        eyebrow: "5. 일정 및 신청",
        title: "다가오는 수업과 이벤트를 보고 바로 신청하세요",
        body: [
          "날짜순으로 일정을 확인하고, 원하는 카드에서 바로 신청할 수 있습니다.",
          "처음이라면 Level 1을 먼저 추천합니다. 기존 회원은 필터로 정규수업, 워크샵, 다이얼로그 모임, 특별 이벤트를 빠르게 좁혀볼 수 있습니다.",
        ],
      },
    ],
    memoDemo: {
      eyebrow: "API 연동 예시",
      title: "메모",
      description: "Spring Boot API와 MariaDB에 저장되는 간단한 메모입니다.",
      formTitle: "메모 작성",
      editFormTitle: "메모 수정",
      titleLabel: "제목",
      titlePlaceholder: "예: 오늘 배운 리듬",
      contentLabel: "내용",
      contentPlaceholder: "짧은 메모를 남겨보세요.",
      createButton: "저장",
      updateButton: "수정 완료",
      cancelButton: "취소",
      editButton: "수정",
      deleteButton: "삭제",
      listTitle: "저장된 메모",
      loading: "메모를 불러오는 중...",
      emptyTitle: "아직 저장된 메모가 없습니다.",
      emptyDescription: "백엔드를 실행한 뒤 첫 메모를 저장해보세요.",
      requiredMessage: "제목과 내용을 모두 입력해주세요.",
      createdMessage: "메모가 저장되었습니다.",
      updatedMessage: "메모가 수정되었습니다.",
      deletedMessage: "메모가 삭제되었습니다.",
    },
    footer: "SwingPop · Dance, Music, Community",
  },
  en: {
    nav: ["SwingPop", "Swing Dance", "Our Style", "Seoul Scene", "Schedule & Apply"],
    heroBadge: "SwingPop Community",
    heroTitle: "SwingPop, a community connected through swing dance",
    heroDesc:
      "Dance connects people, and music makes the moment special.\nSwingPop is a swing dance community built voluntarily by Koreans and internationals together.\nMeet new people through music and dance while learning, growing, and having fun together.",
    heroPrimary: "View & Apply",
    heroSecondary: "About the Community",
    heroCorkboard: "Corkboard",
    mobileApply: "View & Apply",
    languageTitle: "Choose your language",
    languageDesc: "Select Korean or English to continue.",
    visitorGuide: {
      eyebrow: "First Time Here",
      title: "Where to find us",
      description: "If you are visiting for the first time, check class locations, announcements, and contact options here.",
      panels: [
        {
          id: "firstVisit",
          title: "First time here?",
          summary: "Check shoes, payment, and the KP Dance Hall entrance before you come.",
        },
        {
          id: "location",
          title: "Location",
          summary: "Open map links for KP Dance Hall and Dialogue.",
        },
        {
          id: "announcement",
          title: "Announcement Chat",
          summary: "Check class updates and the latest news before you come.",
        },
        {
          id: "contact",
          title: "Contact",
          summary: "Reach us through KakaoTalk or Instagram DM.",
        },
      ],
      firstVisit: {
        items: [
          {
            id: "shoes",
            title: "Indoor shoes",
            body: "Outdoor shoes are not allowed inside the dance hall. You may be able to use dance hall shoes, but the right size may not always be available. If possible, please bring comfortable indoor shoes.",
          },
          {
            id: "payment",
            title: "Cash or bank transfer",
            body: "Swingpop is a community run by volunteers(not a business). We do not have a card payment terminal, so please prepare cash or a bank transfer for the participation fee. For bank transfer, please send it to KAKAOBANK 3333-37-3073172, Daehyuk Jung (정대혁).",
          },
          {
            id: "entrance",
            title: "KP Dance Hall back entrance",
            body: "The front entrance of KP Dance Hall may be locked early. Please check the “How to get to the back entrance” photos below and enter through the back door.",
          },
        ],
        backEntranceButton: "View back entrance guide",
      },
      announcement: {
        intro: "You can check class updates and announcements in the KakaoTalk announcement chat.",
      },
      contact: {
        intro: "If you have any questions, feel free to contact us through KakaoTalk or Instagram DM.",
        kakaoTalk: "KakaoTalk",
        instagram: "Instagram DM",
      },
      location: {
        intro: "Before coming to class, check the map links and venue notes below.",
        googleMaps: "Google Maps",
        naverMap: "Naver Map",
        backEntranceButton: "Show Back Entrance Photos",
        backEntranceCloseButton: "Hide Back Entrance Photos",
      },
    },
    application: {
      scheduleEyebrow: "Schedule",
      applyEyebrow: "Apply",
      filtersTitle: "Open schedules",
      filters: [
        { id: "all", label: "All" },
        { id: "beginner", label: "First-timer" },
        { id: "regular", label: "Regular Class" },
        { id: "workshop", label: "Workshop" },
        { id: "social", label: "Dialogue Social" },
        { id: "event", label: "Special Event" },
      ],
      recommended: "Recommended first",
      scheduleButton: "Go to schedule",
      applyButton: "Apply",
      appliedButton: "Already applied",
      details: {
        date: "Date",
        time: "Time",
        location: "Location",
        price: "Price",
        teacher: "Teacher",
        event: "Event",
      },
      noResults: "No schedules match this filter.",
      loading: "Loading registered schedules and lessons.",
      empty: "There are no open public schedules right now.",
      loadError: "Could not load registered schedules and lessons.",
      free: "Free",
      toBeAnnounced: "TBA",
      paymentNote: "Please pay on site by cash or bank transfer. For bank transfer, please send it to KAKAOBANK 3333-37-3073172, Daehyuk Jung (정대혁).",
      entranceFeeNote: "A separate 10,000 KRW entrance fee applies.",
      levelNotice: "Level 2+ classes have recommended experience guidelines. Please check the class requirements when applying.",
      viewClasses: "View classes",
      classCountLabel: (count) => `${count} ${count === 1 ? "class" : "classes"}`,
      selectClassTitle: "Select a class",
      selectClassIntro: "Choose a class to apply for.",
      closeModal: "Close",
    },
    applicationModal: {
      title: "Enter application details",
      close: "Close",
      nameLabel: "Nickname / Name",
      namePlaceholder: "E.g. Alex or your swing nickname",
      nameHelp: [
        "In the Korean swing dance/Lindy Hop community, there is a culture of using nicknames because the scene has been closely connected with online communities. Please feel free to use either your name or your nickname.",
      ],
      nameManagedBySettings: "This name comes from your account settings.",
      requestMemoLabel: "Questions / Anything you want to share",
      requestMemoPlaceholder: "Share any questions before class or anything you want the team to know.",
      requestMemoHelp:
        "If you would like to receive a reply, please include your email, phone number, KakaoTalk ID, or another way we can contact you.",
      danceRoleLabel: "Role",
      danceRolePlaceholder: "Choose a role",
      danceRoles: {
        LEADER: "Leader",
        FOLLOWER: "Follower",
        BOTH: "Leader / Follower both ok",
      },
      danceRoleGuide: [
        "Lead 👉 The one who gives signals about what move comes next.",
        "Follow 👉 The one who responds to those signals and dances together.",
        "If you can do either role, choose “Leader / Follower both ok.”",
        "Men commonly take the leader role and women the follower role, but anyone can take either role regardless of gender.",
      ],
      contactMethods: {
        PHONE: "Phone number",
        KAKAO_TALK: "KakaoTalk ID",
        WHATSAPP: "WhatsApp",
        INSTAGRAM: "Instagram ID",
        EMAIL: "Email",
      },
      contactPlaceholders: {
        PHONE: "E.g. 010-1234-5678",
        KAKAO_TALK: "E.g. swingpop_kakao",
        WHATSAPP: "E.g. +82 10 1234 5678",
        INSTAGRAM: "E.g. swingpop_seoul",
        EMAIL: "E.g. hello@example.com",
      },
      submit: "Apply",
      submitting: "Applying",
      required: "Please enter your nickname/name.",
      danceRoleRequired: "Please choose a role.",
      submitError: "We could not save your application. Please try again shortly.",
      alreadyAppliedError: "Already applied.",
      successTitle: "Application received.",
      noticeTitle: "Announcement Room",
      noticeBody: "Please check the announcement room for class updates and the latest news.",
      announcementRoom: "KakaoTalk Announcement Room",
      contactTitle: "How to Ask Questions",
      contactBody: "If you have questions, you can contact us below.",
      kakaoTalk: "KakaoTalk",
      koreanContact: "Korean: pethromuse",
      englishContact: "English: maelahreeh",
      instagramDm: "Instagram DM",
      announcementQuestion: "You can also ask questions in the announcement room.",
      mapTitle: "Check Class Location",
      googleMaps: "Google Maps",
      naverMap: "Naver Map",
      chooseAnother: "Class registration complete",
    },
    sections: [
      {
        id: "about",
        eyebrow: "1. About SwingPop",
        title: "What kind of community is SwingPop?",
        body: [
          "SwingPop is not only for experienced dancers. It is a community where people from different backgrounds can meet, connect, and enjoy time together through dance.",
          "We value a warm and open atmosphere where Koreans and internationals naturally mix, and where first-time visitors can feel comfortable joining without pressure.",
        ],
        stats: [
          { label: "Mood", value: "Welcoming" },
          { label: "Community", value: "International" },
          { label: "Experience", value: "Beginner Friendly" },
        ],
      },
      {
        id: "swing",
        eyebrow: "2. About Swing Dance",
        title: "What is swing dance?",
        body: [
          "Swing dance is a social dance that began in the jazz culture of 1920s–30s America and is still enjoyed by people all over the world today. Its defining feature is moving freely to the rhythm in tune with a partner and sharing dances with all kinds of people.",
          "In swing dance, the joy of dancing and connecting together matters more than skill. Each time a song ends you dance with someone new, meeting people naturally—and its greatest charm is the way it connects people across nationalities and languages.",
        ],
        points: ["Rhythm rooted in jazz", "A social dance built on connection", "Accessible for beginners"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. Swing Dance at SwingPop",
        title: "What can you experience at SwingPop?",
        body: [
          "At SwingPop, you learn the basics in class, and during the social dancing that follows, you dance freely with all kinds of people and naturally make what you learned your own. Even first-time dancers can comfortably dance with many partners and enjoy the fun of music and social dancing.",
          "More than dancing well, we value an atmosphere of greeting one another, respecting each other, and enjoying the music together. Koreans and internationals mingle and meet new people, and we are building a community that anyone can join with ease.",
        ],
        cards: [
          {
            title: "Class",
            desc: "Start step by step with a structure that feels approachable.",
          },
          {
            title: "Social Dance",
            desc: "Dance with different people and feel the real energy of swing.",
          },
          {
            title: "Community",
            desc: "Meet people naturally through conversation, music, and dance.",
          },
        ],
      },
      {
        id: "seoul-scene",
        eyebrow: "4. The Seoul Swing Dance Scene",
        title: "Why is swing dance in Seoul special?",
        body: [
          "Seoul has a long-running and active swing dance culture, with dance halls, events, and social parties where you can discover many people and styles.",
          "You may begin with one community, but over time you can explore the wider Seoul scene and enjoy an even bigger world of dance and connection.",
        ],
        highlight: "Seoul is an exciting city for learning and enjoying swing dance, and SwingPop can be your welcoming starting point.",
      },
      {
        id: "schedule",
        eyebrow: "5. Schedule & Apply",
        title: "View upcoming classes and events, then apply",
        body: [
          "Check the date-based list and apply directly from the class or event card you want.",
          "If you are new, Level 1 is the recommended starting point. Returning members can use filters for regular classes, workshops, Dialogue Social, and special events.",
        ],
      },
    ],
    memoDemo: {
      eyebrow: "API Demo",
      title: "Memos",
      description: "Simple memos persisted through the Spring Boot API and MariaDB.",
      formTitle: "Write a memo",
      editFormTitle: "Edit memo",
      titleLabel: "Title",
      titlePlaceholder: "E.g. Rhythm from today",
      contentLabel: "Content",
      contentPlaceholder: "Leave a short memo.",
      createButton: "Save",
      updateButton: "Update",
      cancelButton: "Cancel",
      editButton: "Edit",
      deleteButton: "Delete",
      listTitle: "Saved memos",
      loading: "Loading memos...",
      emptyTitle: "No memos yet.",
      emptyDescription: "Start the backend, then save your first memo.",
      requiredMessage: "Please enter both title and content.",
      createdMessage: "Memo saved.",
      updatedMessage: "Memo updated.",
      deletedMessage: "Memo deleted.",
    },
    footer: "SwingPop · Dance, Music, Community",
  },
};

const ACCOUNT_RESTRICTED_MESSAGES = {
  ko: "계정 이용이 제한되었습니다. 자세한 내용은 운영진에게 문의해주세요.",
  en: "Your account access has been restricted. Please contact the Swingpop team for more information.",
};

function accountRestrictedMessage() {
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ko")) {
    return ACCOUNT_RESTRICTED_MESSAGES.ko;
  }
  return ACCOUNT_RESTRICTED_MESSAGES.en;
}

const LANGUAGE_ONBOARDING_MESSAGES = {
  ko: "선호 언어는 [내 페이지] > [내 설정]에서 변경할 수 있습니다.",
  en: "You can change your preferred language in My Page > My Settings.",
};

function languageOnboardingMessage(language) {
  return language === "en" ? LANGUAGE_ONBOARDING_MESSAGES.en : LANGUAGE_ONBOARDING_MESSAGES.ko;
}

const SECTION_IDS = ["about", "swing", "swingpop-style", "seoul-scene", "schedule"];
// Where a signed-out visitor's choice from the header picker is kept, so it
// survives a reload. Signed-in members are not stored here at all — their
// language lives on the account and the server is the authority.
const GUEST_LANGUAGE_STORAGE_KEY = "swingpop-guest-language";

// Keys written by earlier attempts at this. Wiped on load so a value left by an
// old build cannot outrank the account setting. Deliberately does not include
// GUEST_LANGUAGE_STORAGE_KEY, which is the one key still in use.
const LANGUAGE_STORAGE_KEYS_TO_CLEAR = [
  "swingpop-language",
  "swingpop_guest_language",
  "swingpop_guestLanguage",
  "swingpop-preferred-language",
  "swingpop_preferred_language",
  "language",
  "guestLanguage",
  "preferredLanguage",
];

function readStoredGuestLanguage() {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY);
  return LANGUAGE_OPTIONS.some((option) => option.value === stored) ? stored : null;
}

function writeStoredGuestLanguage(language) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, language);
}

function clearStoredGuestLanguage() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(GUEST_LANGUAGE_STORAGE_KEY);
}
const MEMBER_LANGUAGE_TO_APP_LANGUAGE = {
  KO: "ko",
  EN: "en",
};
const APP_LANGUAGE_TO_MEMBER_LANGUAGE = {
  ko: "KO",
  en: "EN",
};

// Each label is written in its own language, so someone who cannot read the
// current one can still find theirs.
const LANGUAGE_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];

function toAppLanguage(preferredLanguage) {
  const normalized = typeof preferredLanguage === "string" ? preferredLanguage.trim().toUpperCase() : "";
  return MEMBER_LANGUAGE_TO_APP_LANGUAGE[normalized] || null;
}

function toMemberPreferredLanguage(appLanguage) {
  return APP_LANGUAGE_TO_MEMBER_LANGUAGE[appLanguage] || null;
}

function memberApplicationName(authState) {
  if (!authState?.authenticated) {
    return "";
  }

  const nickname = typeof authState.nickname === "string" ? authState.nickname.trim() : "";
  if (nickname) {
    return nickname;
  }

  const displayName = typeof authState.displayName === "string" ? authState.displayName.trim() : "";
  if (displayName) {
    return displayName;
  }

  const email = typeof authState.email === "string" ? authState.email.trim() : "";
  if (email) {
    return email.split("@")[0] || email;
  }

  return authState.memberId ? `Member ${authState.memberId}` : "Member";
}

function clearPersistedLanguagePreferences() {
  if (typeof window === "undefined") {
    return;
  }

  LANGUAGE_STORAGE_KEYS_TO_CLEAR.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

const SETTINGS_COPY = {
  ko: {
    title: "내 설정",
    description: "로그인한 계정의 기본 표시 정보를 관리합니다.",
    email: "이메일",
    displayName: "Google 이름",
    nickname: "닉네임",
    nicknamePlaceholder: "2자 이상 20자 이하",
    preferredLanguage: "선호 언어",
    save: "저장",
    saving: "저장 중",
    saved: "저장되었습니다.",
    loadError: "설정을 불러오지 못했습니다.",
    saveError: "설정을 저장하지 못했습니다.",
    withdrawButton: "탈퇴하기",
    withdrawConfirmTitle: "회원 탈퇴",
    withdrawConfirmBody: "정말 탈퇴하시겠어요? 탈퇴 후에는 현재 계정으로 로그인할 수 없습니다.",
    withdrawCancel: "취소",
    withdrawConfirm: "탈퇴하기",
    withdrawing: "탈퇴 처리 중",
    withdrawSuccess: "탈퇴가 완료되었습니다.",
    withdrawError: "탈퇴 처리에 실패했습니다.",
    loginRequiredTitle: "로그인이 필요합니다",
    loginRequiredBody: "내 설정은 Google 로그인 후 사용할 수 있습니다.",
    login: "Google로 로그인",
    back: "뒤로가기",
    privacyLink: "개인정보처리방침",
    korean: "한국어",
    english: "English",
  },
  en: {
    title: "My Settings",
    description: "Manage the basic display settings for your logged-in account.",
    email: "Email",
    displayName: "Google name",
    nickname: "Nickname",
    nicknamePlaceholder: "2 to 20 characters",
    preferredLanguage: "Preferred language",
    save: "Save",
    saving: "Saving",
    saved: "Settings saved.",
    loadError: "Could not load settings.",
    saveError: "Could not save settings.",
    withdrawButton: "Delete account",
    withdrawConfirmTitle: "Delete account",
    withdrawConfirmBody: "Are you sure you want to delete your account? After deletion, you will not be able to use this account.",
    withdrawCancel: "Cancel",
    withdrawConfirm: "Delete account",
    withdrawing: "Deleting",
    withdrawSuccess: "Your account has been deleted.",
    withdrawError: "Could not delete your account.",
    loginRequiredTitle: "Login required",
    loginRequiredBody: "My Settings is available after Google login.",
    login: "Sign in with Google",
    back: "Back",
    privacyLink: "Privacy Policy",
    korean: "한국어",
    english: "English",
  },
};

const MEMBER_MESSAGES_COPY = {
  ko: {
    title: "내 메시지",
    description: "운영진과 주고받은 메시지를 확인합니다.",
    loginRequiredTitle: "로그인이 필요합니다",
    loginRequiredBody: "내 메시지는 Google 로그인 후 사용할 수 있습니다.",
    login: "Google로 로그인",
    back: "뒤로가기",
    loading: "메시지를 불러오는 중입니다.",
    empty: "아직 주고받은 메시지가 없습니다.",
    placeholder: "운영진에게 남길 메시지를 입력해주세요.",
    send: "보내기",
    sending: "보내는 중",
    loadError: "메시지를 불러오지 못했습니다.",
    sendError: "메시지를 보내지 못했습니다.",
    sent: "메시지가 전송되었습니다.",
    member: "나",
    admin: "운영진",
    staffSender: (name) => (name ? `운영진 - (${name})` : "운영진"),
  },
  en: {
    title: "Messages",
    description: "View your conversation with the Swingpop team.",
    loginRequiredTitle: "Login required",
    loginRequiredBody: "Messages are available after Google login.",
    login: "Sign in with Google",
    back: "Back",
    loading: "Loading messages.",
    empty: "No messages yet.",
    placeholder: "Write a message to the team.",
    send: "Send",
    sending: "Sending",
    loadError: "Could not load messages.",
    sendError: "Could not send message.",
    sent: "Message sent.",
    member: "Me",
    admin: "Staff",
    staffSender: (name) => (name ? `Staff - (${name})` : "Staff"),
  },
};

const MY_CLASSES_COPY = {
  ko: {
    title: "내 신청 내역",
    description: "Google 계정으로 신청한 수업과 이벤트를 확인합니다.",
    loginRequiredTitle: "로그인이 필요합니다",
    loginRequiredBody: "내 신청 내역은 Google 로그인 후 사용할 수 있습니다.",
    login: "Google로 로그인",
    back: "뒤로가기",
    loading: "신청 내역을 불러오는 중입니다.",
    empty: "아직 신청한 수업이 없습니다.",
    loadError: "신청 내역을 불러오지 못했습니다.",
    noticeLoadError: "강습 공지사항을 불러오지 못했습니다.",
    notices: "공지사항",
    noticeAuthorFallback: "운영진",
    status: "신청 완료",
    date: "날짜",
    role: "역할",
    appliedAt: "신청일",
    noRole: "선택 없음",
    roles: {
      LEADER: "리더",
      FOLLOWER: "팔로워",
      BOTH: "리더/팔로워 모두 가능",
    },
  },
  en: {
    title: "My Classes",
    description: "View classes and events you applied for with your Google account.",
    loginRequiredTitle: "Login required",
    loginRequiredBody: "My Classes is available after Google login.",
    login: "Sign in with Google",
    back: "Back",
    loading: "Loading your applications.",
    empty: "You have not applied for any classes yet.",
    loadError: "Could not load your applications.",
    noticeLoadError: "Could not load class notices.",
    notices: "Notices",
    noticeAuthorFallback: "Staff",
    status: "Applied",
    date: "Date",
    role: "Role",
    appliedAt: "Applied",
    noRole: "Not selected",
    roles: {
      LEADER: "Leader",
      FOLLOWER: "Follower",
      BOTH: "Leader / Follower both ok",
    },
  },
};

const MY_PAGE_COPY = {
  ko: {
    topButton: "내 페이지",
    login: "Google로 로그인",
    // Phone widths cannot hold the full label beside the logo and the language
    // picker — the English wording needs 108px at its smallest against an 87px
    // budget at 320px. Below `sm` the button shows the brand name alone; the
    // full wording stays on the button's aria-label. Not translated: it is a
    // brand name, and it is deliberately identical in both languages.
    loginShort: "Google",
    privacyLink: "개인정보처리방침",
    title: "내 페이지",
    description: "신청 내역, 메시지, 계정 설정을 한곳에서 확인합니다.",
    loginRequiredTitle: "로그인이 필요합니다",
    loginRequiredBody: "내 페이지는 Google 로그인 후 사용할 수 있습니다.",
    back: "메인으로",
    accountLabel: "로그인 계정",
    emailLabel: "이메일",
    logout: "로그아웃",
    loggingOut: "로그아웃 중",
    installTitle: "앱으로 설치하기",
    installDescription: "홈 화면에 추가하면 알림을 받을 수 있고, 브라우저 없이 바로 열립니다.",
    installAction: "설치하기",
    installedDescription: "이 기기에 설치되어 있습니다. 다른 기기에서는 그 기기에서 다시 설치해주세요.",
    installedAction: "설치됨",
    iosInstallDescription:
      "아이폰·아이패드는 사파리에서 직접 추가해주세요. 화면 아래 공유 버튼을 누른 뒤 [홈 화면에 추가]를 선택하면 됩니다.",
    installAskConfirm: "확인",
    installAskTitle: "앱으로 설치하시겠어요?",
    installAskBody: "홈 화면에 추가하면 알림을 받을 수 있고, 브라우저 없이 바로 열립니다. 나중에 [내 페이지]에서도 설치할 수 있습니다.",
    installLater: "나중에",
    menu: [
      {
        id: "classes",
        title: "내 신청 내역",
        description: "신청한 수업과 이벤트를 확인합니다.",
      },
      {
        id: "messages",
        title: "메시지",
        description: "운영진과 주고받은 메시지를 확인합니다.",
      },
      {
        id: "settings",
        title: "내 설정",
        description: "닉네임과 선호 언어를 관리합니다.",
      },
    ],
  },
  en: {
    topButton: "My Page",
    login: "Sign in with Google",
    loginShort: "Google",
    privacyLink: "Privacy Policy",
    title: "My Page",
    description: "Manage your classes, messages, and profile.",
    loginRequiredTitle: "Login required",
    loginRequiredBody: "My Page is available after Google login.",
    back: "Home",
    accountLabel: "Signed in as",
    emailLabel: "Email",
    logout: "Logout",
    loggingOut: "Logging out",
    installTitle: "Install the app",
    installDescription: "Add it to your home screen to receive notifications and open it without the browser.",
    installAction: "Install",
    installedDescription: "Installed on this device. Install it again on any other device you use.",
    installedAction: "Installed",
    iosInstallDescription:
      "On iPhone and iPad, add it from Safari: tap the Share button at the bottom of the screen, then choose Add to Home Screen.",
    installAskConfirm: "OK",
    installAskTitle: "Install the app?",
    installAskBody: "Add it to your home screen to receive notifications and open it without the browser. You can also install it later from My Page.",
    installLater: "Not now",
    menu: [
      {
        id: "classes",
        title: "My Classes",
        description: "View the classes and events you applied for.",
      },
      {
        id: "messages",
        title: "Messages",
        description: "Check your conversation with the Swingpop team.",
      },
      {
        id: "settings",
        title: "Settings",
        description: "Manage your nickname and preferred language.",
      },
    ],
  },
};

// Google blocks OAuth inside embedded webviews ("disallowed_useragent"), so the
// in-app browsers of KakaoTalk, Naver and friends can never complete a login.
// Naver Whale (`Whale/`) is a real browser and must not match.
const IN_APP_BROWSER_PATTERN = /KAKAOTALK|NAVER\(inapp|DaumApps|Instagram|FBAN|FBAV|FB_IAB|Line\/|BAND\/|everytimeApp|KAKAOSTORY/i;

function detectInAppBrowser() {
  if (typeof navigator === "undefined") {
    return { isInApp: false, platform: "other" };
  }

  const ua = navigator.userAgent || "";

  return {
    isInApp: IN_APP_BROWSER_PATTERN.test(ua),
    platform: /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) ? "ios" : "other",
  };
}

// Android can hand the URL to Chrome through the intent scheme. iOS gives an
// embedded webview no way to hand off to Safari, so that path stays manual.
function buildChromeIntentUrl(absoluteUrl) {
  const withoutScheme = absoluteUrl.replace(/^https?:\/\//, "");

  return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
    absoluteUrl,
  )};end`;
}

const LOGIN_CONSENT_COPY = {
  ko: {
    eyebrow: "Google 로그인",
    title: "개인정보처리방침 확인",
    description:
      "Google 로그인 또는 첫 회원 등록을 진행하기 전에 개인정보 처리 내용을 확인해주세요.",
    summary:
      "로그인 시 수업 신청과 내 신청 내역 확인을 위해 Google 계정의 고유 식별자, 이메일, 이름 또는 표시 이름 등 최소한의 계정 정보가 저장됩니다.",
    noToken:
      "Google Access Token, Refresh Token, 프로필 이미지 등 불필요한 정보는 저장하지 않습니다.",
    checkbox: "개인정보처리방침을 확인했으며 Google 로그인/회원가입을 진행합니다.",
    privacyLink: "개인정보처리방침",
    continue: "Google로 계속",
    back: "메인으로",
    inAppTitle: "브라우저에서 열어주세요",
    inAppBody:
      "카카오톡·네이버 등 앱 안의 브라우저에서는 Google 정책상 로그인이 차단됩니다. 아래 주소를 복사해 Safari나 Chrome에서 열어주세요.",
    inAppHint: "화면 오른쪽 위 또는 아래의 메뉴에서 '다른 브라우저로 열기' 또는 'Safari로 열기'를 선택해도 됩니다.",
    inAppCopy: "주소 복사",
    inAppCopied: "복사했습니다",
    inAppCopyFailed: "복사가 차단되었습니다. 위 주소를 길게 눌러 직접 복사해주세요.",
    inAppClose: "닫기",
  },
  en: {
    eyebrow: "Google Sign-In",
    title: "Review Privacy Policy",
    description:
      "Please review how personal information is handled before continuing with Google sign-in or first-time registration.",
    summary:
      "When you sign in, SwingPop saves only the minimum account information needed for class applications and application history, such as your Google account identifier, email, and name or display name.",
    noToken:
      "Google Access Tokens, Refresh Tokens, profile images, and other unnecessary information are not stored.",
    checkbox: "I have reviewed the Privacy Policy and want to continue with Google sign-in or registration.",
    privacyLink: "Privacy Policy",
    continue: "Continue with Google",
    back: "Home",
    inAppTitle: "Open in a browser",
    inAppBody:
      "Google blocks sign-in inside in-app browsers such as KakaoTalk or Naver. Copy the address below and open it in Safari or Chrome.",
    inAppHint: "You can also use the menu at the top or bottom of the screen and choose \"Open in browser\" or \"Open in Safari\".",
    inAppCopy: "Copy address",
    inAppCopied: "Copied",
    inAppCopyFailed: "Copying was blocked. Long-press the address above to copy it yourself.",
    inAppClose: "Close",
  },
};

const PRIVACY_POLICY_COPY = {
  ko: {
    back: "메인으로",
    eyebrow: "Privacy",
    title: "개인정보처리방침",
    intro: "스윙팝은 Google 로그인을 통해 회원을 식별하기 위해 필요한 최소한의 정보만 저장합니다.",
    sections: [
      {
        title: "수집하는 정보",
        items: [
          "Google 계정의 고유 식별자",
          "이메일",
          "이름 또는 표시 이름",
          "회원 역할",
          "회원 상태",
          "가입일, 수정일, 마지막 로그인 시각",
        ],
      },
      {
        title: "수집하지 않는 정보",
        items: [
          "Google Access Token",
          "Google Refresh Token",
          "Google 프로필 이미지",
          "전화번호",
          "주소",
          "생년월일",
          "성별",
          "기타 불필요한 개인정보",
        ],
      },
      {
        title: "수집 목적",
        items: [
          "로그인 및 회원 식별",
          "수업 신청 내역 관리",
          "내 신청 내역 확인",
          "운영상 필요한 회원 상태 관리",
        ],
      },
      {
        title: "회원 탈퇴",
        items: [
          "회원 탈퇴 시 회원 정보는 복구할 수 없습니다.",
          "이메일 등 개인을 식별할 수 있는 정보는 삭제 또는 복구할 수 없는 방식으로 마스킹 처리됩니다.",
        ],
      },
      {
        title: "보관 및 관리",
        items: [
          "스윙팝은 서비스 운영에 필요한 최소한의 개인정보만 보관합니다.",
          "불필요한 Google 토큰 정보는 저장하지 않습니다.",
          "개인정보는 운영 목적 외로 사용하지 않습니다.",
        ],
      },
      {
        title: "문의",
        items: ["개인정보 관련 문의는 스윙팝 운영진에게 연락해주세요."],
      },
    ],
  },
  en: {
    back: "Home",
    eyebrow: "Privacy",
    title: "Privacy Policy",
    intro: "SwingPop stores only the minimum information needed to identify members through Google sign-in.",
    sections: [
      {
        title: "Information We Collect",
        items: [
          "Google account unique identifier",
          "Email address",
          "Name or display name",
          "Member role",
          "Member status",
          "Signup date, updated date, and last login time",
        ],
      },
      {
        title: "Information We Do Not Collect",
        items: [
          "Google Access Token",
          "Google Refresh Token",
          "Google profile image",
          "Phone number",
          "Address",
          "Date of birth",
          "Gender",
          "Other unnecessary personal information",
        ],
      },
      {
        title: "Purpose of Collection",
        items: [
          "Login and member identification",
          "Managing class application history",
          "Viewing my application history",
          "Managing member status required for service operation",
        ],
      },
      {
        title: "Account Withdrawal",
        items: [
          "Once you withdraw your membership, your member information cannot be restored.",
          "Information that can identify you, such as your email address, will be deleted or masked in a non-recoverable way.",
        ],
      },
      {
        title: "Retention and Management",
        items: [
          "SwingPop keeps only the minimum personal information needed to operate the service.",
          "Unnecessary Google token information is not stored.",
          "Personal information is not used for purposes other than service operation.",
        ],
      },
      {
        title: "Contact",
        items: ["For privacy-related questions, please contact the SwingPop team."],
      },
    ],
  },
};

const announcementLinks = [
  {
    type: "kakao",
    labelKo: "카카오톡 공지방 들어가기",
    labelEn: "Open KakaoTalk Announcement Chat",
    url: "https://open.kakao.com/o/gdODdZIe",
    isEnabled: true,
  },
];

const contactLinks = [
  {
    type: "kakaoTalk",
    labelKo: "한국어 문의",
    labelEn: "Korean contact",
    value: "pethromuse",
    isEnabled: true,
  },
  {
    type: "kakaoTalk",
    labelKo: "영어 문의",
    labelEn: "English contact",
    value: "maelahreeh",
    isEnabled: true,
  },
  {
    type: "instagram",
    labelKo: "인스타그램 DM 보내기",
    labelEn: "Send Instagram DM",
    url: "https://www.instagram.com/swingpopseoul",
    isEnabled: true,
  },
];

const kpBackEntranceImages = [
  {
    imageUrl: "",
    altTextKo: "KP 댄스홀 뒷문 안내 사진 1",
    altTextEn: "KP Dance Hall back entrance guide photo 1",
    sortOrder: 1,
  },
  {
    imageUrl: "",
    altTextKo: "KP 댄스홀 뒷문 안내 사진 2",
    altTextEn: "KP Dance Hall back entrance guide photo 2",
    sortOrder: 2,
  },
  {
    imageUrl: "",
    altTextKo: "KP 댄스홀 뒷문 안내 사진 3",
    altTextEn: "KP Dance Hall back entrance guide photo 3",
    sortOrder: 3,
  },
  {
    imageUrl: "",
    altTextKo: "KP 댄스홀 뒷문 안내 사진 4",
    altTextEn: "KP Dance Hall back entrance guide photo 4",
    sortOrder: 4,
  },
];

const locations = [
  {
    name: "KP 댄스홀",
    anchorId: "kp-dance-hall",
    nameKo: "KP 댄스홀",
    nameEn: "KP Dance Hall",
    googleMapUrl: "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96",
    naverMapUrl: "https://naver.me/x2jQH2Tt",
    descriptionKo: "KP 댄스홀에 오실 때는 지도와 뒷문 안내를 함께 확인해주세요.",
    descriptionEn: "When visiting KP Dance Hall, please check the map links and the back entrance guide.",
    noticeKo: "KP 댄스홀 정문은 잠겨 있으니 뒷문으로 와주세요.",
    noticeEn: "The front entrance of KP Dance Hall is locked. Please use the back entrance.",
    images: kpBackEntranceImages,
  },
  {
    name: "Dialogue",
    anchorId: "dialogue",
    nameKo: "Dialogue",
    nameEn: "Dialogue",
    googleMapUrl: "https://maps.app.goo.gl/8MZ5WYknUoQzecYc6",
    naverMapUrl: "https://naver.me/GYC9bsWA",
    descriptionKo: "Dialogue 장소 지도는 아래 링크에서 확인할 수 있습니다.",
    descriptionEn: "Use the map links below to find Dialogue.",
    noticeKo: "",
    noticeEn: "",
    images: [],
  },
];

const visitorGuideInfo = {
  announcementLinks,
  contactLinks,
  locations,
};

function validateContentShape(content) {
  const locales = Object.keys(content);

  if (!locales.includes("ko") || !locales.includes("en")) {
    throw new Error("CONTENT must include both 'ko' and 'en' locales.");
  }

  locales.forEach((localeKey) => {
    const locale = content[localeKey];

    if (!Array.isArray(locale.nav) || locale.nav.length !== SECTION_IDS.length) {
      throw new Error(`Locale '${localeKey}' must have ${SECTION_IDS.length} nav items.`);
    }

    if (!Array.isArray(locale.sections) || locale.sections.length !== SECTION_IDS.length) {
      throw new Error(`Locale '${localeKey}' must have ${SECTION_IDS.length} sections.`);
    }

    locale.sections.forEach((section, index) => {
      if (section.id !== SECTION_IDS[index]) {
        throw new Error(`Locale '${localeKey}' section order is invalid at index ${index}.`);
      }
    });
  });

  return true;
}

function runComponentTests() {
  validateContentShape(CONTENT);

  if (!CONTENT.ko.sections.some((section) => section.id === "schedule") || !CONTENT.en.sections.some((section) => section.id === "schedule")) {
    throw new Error("Schedule section is required in both languages.");
  }

  if (!CONTENT.ko.mobileApply || !CONTENT.en.mobileApply) {
    throw new Error("Mobile sticky CTA label is required in both languages.");
  }

  if (!CONTENT.ko.application?.filters?.length || !CONTENT.en.application?.filters?.length) {
    throw new Error("Application filters are required in both languages.");
  }

  if (!CONTENT.ko.application.filters.some((filter) => filter.id === "beginner")) {
    throw new Error("A beginner filter is required.");
  }

  if (!CONTENT.ko.visitorGuide || !CONTENT.en.visitorGuide) {
    throw new Error("Visitor guide content is required in both languages.");
  }

  const expectedVisitorGuidePanelOrder = ["firstVisit", "location", "announcement", "contact"];
  const koVisitorGuidePanelOrder = CONTENT.ko.visitorGuide.panels.map((panel) => panel.id);
  const enVisitorGuidePanelOrder = CONTENT.en.visitorGuide.panels.map((panel) => panel.id);

  if (
    koVisitorGuidePanelOrder.join(",") !== expectedVisitorGuidePanelOrder.join(",") ||
    enVisitorGuidePanelOrder.join(",") !== expectedVisitorGuidePanelOrder.join(",")
  ) {
    throw new Error("Visitor guide panel order must be first visit, location, announcement, contact.");
  }

  if (!CONTENT.ko.visitorGuide.firstVisit?.backEntranceButton || !CONTENT.en.visitorGuide.firstVisit?.backEntranceButton) {
    throw new Error("First visit back entrance button labels are required.");
  }

  if (!visitorGuideInfo.announcementLinks.some((link) => link.type === "kakao" && link.isEnabled)) {
    throw new Error("KakaoTalk announcement link is required.");
  }

  if (!visitorGuideInfo.locations.some((location) => location.name === "KP 댄스홀" && location.anchorId && location.images.length === 4)) {
    throw new Error("KP Dance Hall must include four back entrance image slots.");
  }

  return true;
}

runComponentTests();

function ImagePlaceholder({ label = "Image Placeholder", height = "h-72" }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-3xl border border-dashed border-swing-border/30 bg-swing-cream/35 text-sm text-swing-muted ${height}`}
    >
      {label}
    </div>
  );
}

// Crossfading auto-advancing image slideshow. All images stack absolutely inside
// a positioned parent; only the active one is opaque.
function Slideshow({ images, alt, intervalMs = 3000, focus = {}, className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return undefined;
    }
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className={`absolute inset-0 ${className}`} role="img" aria-label={alt}>
      {images.map((item, i) => (
        <img
          key={item.src}
          src={item.src}
          alt=""
          decoding="async"
          data-active={i === index ? "true" : undefined}
          style={focus[item.name] ? { objectPosition: focus[item.name] } : undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

function SectionWrapper({ id, children, className = "", contentClassName = "py-20" }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className={`mx-auto max-w-6xl px-6 md:px-8 ${contentClassName}`}>{children}</div>
    </section>
  );
}

function LanguageSelectionModal({ title, description, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-swing-ink/45 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      aria-describedby="language-modal-description"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-swing-border/20 bg-swing-paper p-6 shadow-2xl sm:p-7">
        <div className="mb-4 inline-flex rounded-full border border-swing-border/30 bg-swing-cream/50 px-3 py-1 text-xs font-medium text-swing-teal-deep">
          Language Selection
        </div>
        <h2 id="language-modal-title" className="text-2xl font-semibold tracking-tight text-swing-ink">
          {title}
        </h2>
        <p id="language-modal-description" className="mt-3 text-sm leading-6 text-swing-ink/70">
          {description}
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => onSelect("ko")}
            className="flex w-full items-center justify-between rounded-2xl border border-swing-border/30 bg-swing-paper px-5 py-4 text-left shadow-sm transition hover:border-swing-border/45 hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            aria-label="한국어 선택"
          >
            <div>
              <div className="text-base font-semibold text-swing-ink">한국어</div>
              <div className="mt-1 text-sm text-swing-ink/65">한국어로 페이지 보기</div>
            </div>
            <span className="text-swing-teal-deep">→</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("en")}
            className="flex w-full items-center justify-between rounded-2xl border border-swing-border/30 bg-swing-paper px-5 py-4 text-left shadow-sm transition hover:border-swing-border/45 hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            aria-label="Choose English"
          >
            <div>
              <div className="text-base font-semibold text-swing-ink">English</div>
              <div className="mt-1 text-sm text-swing-ink/65">View the page in English</div>
            </div>
            <span className="text-swing-teal-deep">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function scrollToHash(hash) {
  if (!hash?.startsWith("#")) {
    return;
  }

  const target = document.querySelector(hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Anchor-only navigation over sections that already exist. No routing added.
/**
 * Header language picker. Replaces the modal that used to block the first
 * visit: the site opens in Korean, and anyone who needs another language can
 * reach for this instead of being stopped at the door.
 */
function LanguageMenu({ language, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const current = LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${current.label}`}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-[0.04em] text-swing-muted transition hover:bg-swing-cream hover:text-swing-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
        {/* "Language" always in English above the current value: someone who
            cannot read 한국어 needs a word they recognise to know what this
            opens. Stacked rather than inline so it costs no header width. */}
        <span className="flex flex-col items-start leading-none">
          <span className="text-[9px] font-normal uppercase tracking-[0.1em] text-swing-muted/70">
            Language
          </span>
          <span className="mt-0.5">{current.label}</span>
        </span>
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-[80] mt-1 min-w-[128px] overflow-hidden rounded-lg border border-swing-border/30 bg-swing-paper py-1 shadow-frame"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const isCurrent = option.value === current.value;

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setIsOpen(false);
                    if (!isCurrent) {
                      onChange(option.value);
                    }
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-swing-cream ${
                    isCurrent ? "font-bold text-swing-teal-deep" : "text-swing-ink/80"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SiteHeader({ nav, corkboardLabel, onCorkboard, language, onLanguageChange }) {
  return (
    <header className="sticky top-0 z-[70] border-b border-swing-border/30 bg-swing-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-5 md:gap-4 md:px-8">
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            scrollToHash("#top");
          }}
          className="shrink-0 font-display text-base font-bold tracking-[0.1em] text-swing-teal-deep transition hover:text-swing-teal sm:text-lg sm:tracking-[0.14em]"
        >
          SWINGPOP
        </a>

        <nav className="hidden flex-1 justify-center lg:flex" aria-label="Site">
          <ul className="flex items-center gap-1">
            {nav.map((label, index) => {
              const hash = `#${SECTION_IDS[index]}`;

              return (
                <li key={hash}>
                  <a
                    href={hash}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToHash(hash);
                    }}
                    className="inline-flex min-h-[38px] items-center rounded-full px-3 text-xs font-medium tracking-[0.08em] text-swing-muted transition hover:bg-swing-cream hover:text-swing-ink"
                  >
                    {label}
                  </a>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={onCorkboard}
                className="inline-flex min-h-[38px] items-center rounded-full px-3 text-xs font-medium tracking-[0.08em] text-swing-burgundy transition hover:bg-swing-gold/25"
              >
                {corkboardLabel}
              </button>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center lg:ml-0">
          <LanguageMenu language={language} onChange={onLanguageChange} />
          {/* Reserves room for the fixed AuthControl button in the top-right.
              Must stay at least as wide as its widest label at that breakpoint,
              or the nav runs underneath it at lg. Below `sm` the button drops to
              its short label ("Sign in", 69px), so reserving the full 144px
              there overflowed the row and pushed the button off-screen on any
              phone narrower than 410px. */}
          <div className="h-1 w-20 sm:w-36" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

// Stays mounted and slides out of frame when hidden, so both directions are
// animated. Unmounting would make it pop back in with no transition.
function MobileStickyCta({ label, onClick, isVisible }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[90] border-t border-swing-border/25 bg-swing-paper/92 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-8px_30px_rgba(46,39,32,0.12)] backdrop-blur transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none md:hidden ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        onClick={onClick}
        // Untabbable while off-screen, or keyboard focus lands on a button the
        // user cannot see.
        tabIndex={isVisible ? undefined : -1}
        className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-swing-teal-deep px-5 text-sm font-medium tracking-wide text-swing-paper shadow-frame transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper"
        aria-label={label}
      >
        {label}
      </button>
    </div>
  );
}

function getLocalizedLinkLabel(item, language) {
  return language === "en" ? item.labelEn : item.labelKo;
}

function VisitorGuideLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-swing-border/35 bg-swing-paper/85 px-4 text-sm font-medium text-swing-teal-deep transition hover:-translate-y-0.5 hover:bg-swing-cream focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-sky/30"
    >
      {children}
    </a>
  );
}

function VisitorGuidePanel({ panel, isOpen, onToggle, children }) {
  const contentId = `visitor-guide-${panel.id}`;

  return (
    <article className="swing-frame overflow-hidden rounded-sm bg-swing-paper/90">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[76px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-swing-cream/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-swing-teal sm:px-6"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span>
          <span className="block font-display text-base font-bold text-swing-ink sm:text-lg">{panel.title}</span>
          <span className="mt-1 block text-sm leading-6 text-swing-muted">{panel.summary}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-swing-teal/40 bg-swing-mint/50 text-lg font-semibold text-swing-teal-deep transition-transform duration-300 ease-in-out">
          <span className={`block transition-transform duration-300 ease-in-out ${isOpen ? "rotate-45" : ""}`}>+</span>
        </span>
      </button>
      <div
        id={contentId}
        aria-hidden={!isOpen}
        {...(isOpen ? {} : { inert: "" })}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-swing-border/20 px-5 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </article>
  );
}

function VisitorGuideSection({ language, labels, info }) {
  const [openPanelId, setOpenPanelId] = useState(null);
  const [openImageLocations, setOpenImageLocations] = useState([]);

  const enabledAnnouncementLinks = info.announcementLinks.filter((link) => link.isEnabled);
  const kakaoContacts = info.contactLinks.filter((link) => link.isEnabled && link.type === "kakaoTalk");
  const instagramLinks = info.contactLinks.filter((link) => link.isEnabled && link.type === "instagram");
  const backEntranceLocation = info.locations.find((location) => location.images.length > 0);

  const togglePanel = (panelId) => {
    setOpenPanelId((currentPanelId) => (currentPanelId === panelId ? null : panelId));
  };

  const toggleImageLocation = (locationName) => {
    setOpenImageLocations((currentLocations) =>
      currentLocations.includes(locationName)
        ? currentLocations.filter((currentName) => currentName !== locationName)
        : [...currentLocations, locationName]
    );
  };

  const handleShowBackEntranceGuide = () => {
    if (!backEntranceLocation) {
      return;
    }

    setOpenPanelId("location");
    setOpenImageLocations((currentLocations) =>
      currentLocations.includes(backEntranceLocation.name)
        ? currentLocations
        : [...currentLocations, backEntranceLocation.name]
    );

    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      document
        .getElementById(`visitor-guide-location-${backEntranceLocation.anchorId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const renderFirstVisitPanel = () => (
    <div>
      <div className="grid gap-3">
        {labels.firstVisit.items.map((item, index) => (
          <article key={item.id} className="rounded-2xl border border-swing-border/25 bg-swing-cream/55 p-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-swing-border/35 bg-swing-paper/85 text-xs font-semibold text-swing-teal-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-swing-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-swing-muted">{item.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      {backEntranceLocation ? (
        <button
          type="button"
          onClick={handleShowBackEntranceGuide}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-swing-border/35 bg-swing-paper/85 px-4 text-sm font-semibold text-swing-teal-deep shadow-sm transition hover:-translate-y-0.5 hover:bg-swing-cream focus:outline-none focus:ring-2 focus:ring-swing-teal sm:w-auto"
        >
          {labels.firstVisit.backEntranceButton}
        </button>
      ) : null}
    </div>
  );

  const renderAnnouncementPanel = () => (
    <div>
      <p className="text-sm leading-7 text-swing-muted">{labels.announcement.intro}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {enabledAnnouncementLinks.map((link) => (
          <VisitorGuideLink key={link.type} href={link.url}>
            {getLocalizedLinkLabel(link, language)}
          </VisitorGuideLink>
        ))}
      </div>
    </div>
  );

  const renderContactPanel = () => (
    <div>
      <p className="text-sm leading-7 text-swing-muted">{labels.contact.intro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-swing-border/25 bg-swing-cream/55 p-4">
          <div className="text-sm font-semibold text-swing-ink">{labels.contact.kakaoTalk}</div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-swing-muted">
            {kakaoContacts.map((contact) => (
              <div key={`${contact.type}-${contact.value}`} className="flex flex-wrap gap-x-2 gap-y-1">
                <span className="font-semibold text-swing-ink">{getLocalizedLinkLabel(contact, language)}:</span>
                <span>{contact.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-swing-border/25 bg-swing-paper/85 p-4">
          <div className="text-sm font-semibold text-swing-ink">{labels.contact.instagram}</div>
          <div className="mt-3 flex flex-col gap-2">
            {instagramLinks.map((link) => (
              <VisitorGuideLink key={link.type} href={link.url}>
                {getLocalizedLinkLabel(link, language)}
              </VisitorGuideLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationPanel = () => (
    <div>
      <p className="text-sm leading-7 text-swing-muted">{labels.location.intro}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {info.locations.map((location) => {
          const locationName = language === "en" ? location.nameEn : location.nameKo;
          const description = language === "en" ? location.descriptionEn : location.descriptionKo;
          const notice = language === "en" ? location.noticeEn : location.noticeKo;
          const sortedImages = [...location.images].sort((first, second) => first.sortOrder - second.sortOrder);
          const hasImages = sortedImages.length > 0;
          const areImagesOpen = openImageLocations.includes(location.name);

          return (
            <article
              id={`visitor-guide-location-${location.anchorId}`}
              key={location.name}
              className="scroll-mt-28 rounded-3xl border border-swing-border/25 bg-swing-paper/85 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-swing-ink">{locationName}</h3>
                  <p className="mt-2 text-sm leading-7 text-swing-muted">{description}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <VisitorGuideLink href={location.googleMapUrl}>{labels.location.googleMaps}</VisitorGuideLink>
                  <VisitorGuideLink href={location.naverMapUrl}>{labels.location.naverMap}</VisitorGuideLink>
                </div>

                {notice ? (
                  <div className="rounded-2xl border border-swing-teal/30 bg-swing-teal/10 px-4 py-3 text-sm leading-7 text-swing-teal-deep">
                    {notice}
                  </div>
                ) : null}

                {hasImages ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleImageLocation(location.name)}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-swing-border/35 bg-swing-cream/60 px-4 text-sm font-semibold text-swing-teal-deep transition hover:bg-swing-mint/60 focus:outline-none focus:ring-2 focus:ring-swing-teal sm:w-auto"
                      aria-expanded={areImagesOpen}
                    >
                      {areImagesOpen ? labels.location.backEntranceCloseButton : labels.location.backEntranceButton}
                    </button>

                    {areImagesOpen ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {sortedImages.map((image) => (
                          <figure key={image.sortOrder} className="overflow-hidden rounded-2xl border border-swing-border/25 bg-swing-cream/60/70">
                            {image.imageUrl ? (
                              <img
                                src={image.imageUrl}
                                alt={language === "en" ? image.altTextEn : image.altTextKo}
                                className="aspect-[4/3] w-full object-cover"
                              />
                            ) : (
                              <div className="flex aspect-[4/3] w-full items-center justify-center px-4 text-center text-sm font-medium leading-6 text-swing-muted/70">
                                {language === "en" ? image.altTextEn : image.altTextKo}
                              </div>
                            )}
                          </figure>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  const renderPanelContent = (panelId) => {
    if (panelId === "firstVisit") {
      return renderFirstVisitPanel();
    }
    if (panelId === "announcement") {
      return renderAnnouncementPanel();
    }
    if (panelId === "contact") {
      return renderContactPanel();
    }
    return renderLocationPanel();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div>
        <p className="font-display text-sm tracking-[0.2em] text-swing-teal">{labels.eyebrow}</p>
        <h2 className="mt-4 font-display text-[1.6rem] font-bold leading-snug text-swing-ink md:text-[2.1rem]">
          {labels.title}
        </h2>
        <p className="mt-5 max-w-xl text-[0.95rem] leading-8 text-swing-muted">{labels.description}</p>
      </div>
      <div className="grid gap-3">
        {labels.panels.map((panel) => (
          <VisitorGuidePanel
            key={panel.id}
            panel={panel}
            isOpen={openPanelId === panel.id}
            onToggle={() => togglePanel(panel.id)}
          >
            {renderPanelContent(panel.id)}
          </VisitorGuidePanel>
        ))}
      </div>
    </div>
  );
}

function createEmptyMemoForm() {
  return {
    title: "",
    content: "",
  };
}

function formatMemoDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMessageDate(value, language) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function lessonIdFromApplication(application) {
  const scheduleItemId = String(application?.scheduleItemId || "");
  if (!scheduleItemId.startsWith("lesson-")) {
    return null;
  }
  const lessonId = Number(scheduleItemId.replace("lesson-", ""));
  return Number.isFinite(lessonId) ? lessonId : null;
}

function formatLessonNoticeAuthor(notice, labels) {
  const nickname = String(notice?.authorNickname || "").trim();
  const displayName = String(notice?.authorDisplayName || "").trim();
  if (nickname && displayName && nickname !== displayName) {
    return `${nickname} / ${displayName}`;
  }
  return nickname || displayName || labels.noticeAuthorFallback;
}

function formatStaffSenderLabel(message, labels) {
  const displayName =
    typeof message?.senderAdminDisplayName === "string" ? message.senderAdminDisplayName.trim() : "";
  return labels.staffSender(displayName);
}

function formatClassDate(value, language) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatClassRole(role, labels) {
  return labels.roles?.[role] || labels.noRole;
}

function MemoBoard({ labels }) {
  const [memos, setMemos] = useState([]);
  const [form, setForm] = useState(createEmptyMemoForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;

  const loadMemos = async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextMemos = await memoApi.findAll();
      setMemos(nextMemos);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemos();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(createEmptyMemoForm());
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
    };

    if (!payload.title || !payload.content) {
      setError(labels.requiredMessage);
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing) {
        await memoApi.update(editingId, payload);
        setNotice(labels.updatedMessage);
      } else {
        await memoApi.create(payload);
        setNotice(labels.createdMessage);
      }

      resetForm();
      await loadMemos();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (memo) => {
    setEditingId(memo.id);
    setForm({
      title: memo.title,
      content: memo.content,
    });
    setError("");
    setNotice("");
  };

  const handleDelete = async (memoId) => {
    setError("");
    setNotice("");

    try {
      await memoApi.remove(memoId);
      if (editingId === memoId) {
        resetForm();
      }
      setNotice(labels.deletedMessage);
      await loadMemos();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-swing-muted">
          {labels.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-swing-ink md:text-5xl">
          {labels.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-8 text-swing-ink/70">
          {labels.description}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-swing-border/30 bg-swing-paper p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-swing-ink">
            {isEditing ? labels.editFormTitle : labels.formTitle}
          </h3>

          <label className="mt-5 block text-sm font-medium text-swing-ink/75" htmlFor="memo-title">
            {labels.titleLabel}
          </label>
          <input
            id="memo-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleFormChange}
            placeholder={labels.titlePlaceholder}
            className="swing-field mt-2 min-h-[48px] w-full rounded-2xl border px-4 text-sm outline-none transition"
          />

          <label className="mt-4 block text-sm font-medium text-swing-ink/75" htmlFor="memo-content">
            {labels.contentLabel}
          </label>
          <textarea
            id="memo-content"
            name="content"
            value={form.content}
            onChange={handleFormChange}
            placeholder={labels.contentPlaceholder}
            rows={5}
            className="swing-field mt-2 w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-6 outline-none transition"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {isEditing ? labels.updateButton : labels.createButton}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50"
              >
                {labels.cancelButton}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-swing-border/30 bg-swing-paper p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-swing-ink">{labels.listTitle}</h3>
          {isLoading ? <span className="text-sm text-swing-ink/50">{labels.loading}</span> : null}
        </div>

        <div className="mt-4 space-y-3" aria-live="polite">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-swing-sage bg-swing-sage/40 px-4 py-3 text-sm leading-6 text-swing-teal-deep">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {!isLoading && memos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-swing-border/30 bg-swing-cream/40 p-6">
              <div className="text-base font-semibold text-swing-ink">{labels.emptyTitle}</div>
              <p className="mt-2 text-sm leading-6 text-swing-ink/65">{labels.emptyDescription}</p>
            </div>
          ) : null}

          {memos.map((memo) => (
            <article key={memo.id} className="rounded-3xl border border-swing-border/20 bg-swing-cream/30 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-swing-ink">{memo.title}</h4>
                  <p className="mt-1 text-xs text-swing-ink/45">{formatMemoDate(memo.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(memo)}
                    className="rounded-full border border-swing-border/30 bg-swing-paper px-4 py-2 text-sm font-medium text-swing-ink transition hover:bg-swing-cream/50"
                  >
                    {labels.editButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(memo.id)}
                    className="rounded-full border border-red-200 bg-swing-paper px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    {labels.deleteButton}
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-swing-ink/70">{memo.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// `tone` only swaps colors. The default keeps the existing look for the
// application modal and My Classes, which are not part of the public redesign.
function DetailRow({ label, value, tone = "default" }) {
  const isSwing = tone === "swing";

  return (
    <div>
      <dt
        className={`text-xs font-semibold uppercase tracking-[0.12em] ${
          isSwing ? "text-swing-muted/70" : "text-swing-muted/70"
        }`}
      >
        {label}
      </dt>
      <dd className={`mt-1 text-sm leading-6 ${isSwing ? "text-swing-ink/85" : "text-swing-ink/75"}`}>{value}</dd>
    </div>
  );
}

function PriceValue({ price, note }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span>{price}</span>
      {note ? <span className="text-xs leading-5 text-swing-ink/45">{note}</span> : null}
    </span>
  );
}

const EVENT_TYPE_LABELS = {
  ko: {
    REGULAR_CLASS: "정규수업",
    PARTY: "특별 이벤트",
    DIALOGUE_PARTY: "다이얼로그 모임",
  },
  en: {
    REGULAR_CLASS: "Regular Class",
    PARTY: "Special Event",
    DIALOGUE_PARTY: "Dialogue Social",
  },
};

// Recurring cadence shown as a small badge next to the event type on schedule cards.
const EVENT_RECURRENCE_LABELS = {
  ko: {
    REGULAR_CLASS: "매주 토요일",
    DIALOGUE_PARTY: "격주 수요일",
  },
  en: {
    REGULAR_CLASS: "Every Saturday",
    DIALOGUE_PARTY: "Every other Wednesday",
  },
};

function getScheduleTranslation(item, language) {
  return item.translations?.[language] || item.translations?.ko || {};
}

function getFilterIds(item) {
  const filters = new Set();

  if (item.eventType === "REGULAR_CLASS") {
    filters.add("regular");
  }

  if (item.eventType === "DIALOGUE_PARTY") {
    filters.add("social");
    filters.add("event");
  }

  if (item.eventType === "PARTY") {
    filters.add("event");
  }

  if (item.lessonType === "LEVEL1") {
    filters.add("beginner");
    filters.add("regular");
  }

  if (["LEVEL2", "LEVEL3", "LEVEL4"].includes(item.lessonType)) {
    filters.add("regular");
  }

  if (item.lessonType === "WORKSHOP") {
    filters.add("workshop");
  }

  return Array.from(filters);
}

function formatDateRange(startDate, endDate, language) {
  if (!startDate) {
    return "";
  }

  const locale = language === "en" ? "en-US" : "ko-KR";
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });
  const formattedStart = formatter.format(new Date(`${startDate}T00:00:00`));

  if (!endDate || endDate === startDate) {
    return formattedStart;
  }

  return `${formattedStart} - ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
}

function formatTimeRange(startTime, endTime) {
  const trimTime = (value) => (value ? value.slice(0, 5) : "");
  const start = trimTime(startTime);
  const end = trimTime(endTime);

  if (!start && !end) {
    return "";
  }
  if (!end) {
    return start;
  }
  return `${start}-${end}`;
}

function formatPrice(fee, currency, labels, language) {
  if (fee === null || fee === undefined) {
    return labels.toBeAnnounced;
  }

  const amount = Number(fee);
  if (amount === 0) {
    return labels.free;
  }

  if (currency === "KRW") {
    const formatted = new Intl.NumberFormat(language === "en" ? "en-US" : "ko-KR").format(amount);
    return language === "en" ? `KRW ${formatted}` : `${formatted}원`;
  }

  return `${amount.toLocaleString()} ${currency || ""}`.trim();
}

function formatTeachers(teachers, labels) {
  if (!Array.isArray(teachers) || teachers.length === 0) {
    return labels.toBeAnnounced;
  }

  return teachers.map((teacher) => teacher.teacherUserNm).filter(Boolean).join(", ") || labels.toBeAnnounced;
}

function toApplicationItem(item, language, labels) {
  const translation = getScheduleTranslation(item, language);
  const eventTypeLabel = EVENT_TYPE_LABELS[language]?.[item.eventType] || item.eventType;
  const recurrenceLabel = EVENT_RECURRENCE_LABELS[language]?.[item.eventType] || "";

  return {
    id: item.id,
    target: {
      eventId: item.eventId,
      lessonId: item.lessonId,
      lessonType: item.lessonType,
    },
    filterIds: getFilterIds(item),
    isRecommended: item.recommendedForBeginners,
    requiresLevelNotice: item.requiresLevelNotice,
    eventType: eventTypeLabel,
    recurrence: recurrenceLabel,
    title: translation.title || translation.eventTitle || eventTypeLabel,
    eventTitle: translation.eventTitle || eventTypeLabel,
    eventDescription: translation.shortDescription || translation.description || "",
    startDateRaw: item.startDate || "",
    endDateRaw: item.endDate || "",
    date: formatDateRange(item.startDate, item.endDate, language),
    time: formatTimeRange(item.startTime, item.endTime) || labels.toBeAnnounced,
    location: item.location || labels.toBeAnnounced,
    addressInfoEnabled: Boolean(item.addressInfoEnabled),
    googleMapUrl: item.googleMapUrl || "",
    naverMapUrl: item.naverMapUrl || "",
    price: formatPrice(item.fee, item.currency, labels, language),
    paymentNote: item.fee !== null && item.fee !== undefined && Number(item.fee) > 0 ? labels.paymentNote : "",
    entranceFeeNote: item.eventType === "REGULAR_CLASS" ? labels.entranceFeeNote : "",
    teacher: formatTeachers(item.teachers, labels),
    description: translation.description || translation.shortDescription || "",
    roleSelectionEnabled: Boolean(item.roleSelectionEnabled),
  };
}

// The public schedule returns one row per lesson; the landing page groups those
// lessons under their parent event so the list stays short. Each group keeps its
// lessons (application items) for the class-selection modal, and aggregates the
// filters / recommendation / date range for the event card.
function groupApplicationItemsByEvent(items) {
  const groups = new Map();
  items.forEach((item) => {
    const eventId = item.target?.eventId ?? item.id;
    let group = groups.get(eventId);
    if (!group) {
      group = {
        id: `event-${eventId}`,
        eventId,
        eventType: item.eventType,
        recurrence: item.recurrence,
        title: item.eventTitle,
        description: item.eventDescription || "",
        filterIds: new Set(),
        isRecommended: false,
        startDate: item.startDateRaw || "",
        endDate: item.endDateRaw || "",
        lessons: [],
      };
      groups.set(eventId, group);
    }
    group.lessons.push(item);
    (item.filterIds || []).forEach((filterId) => group.filterIds.add(filterId));
    if (!group.description && item.eventDescription) {
      group.description = item.eventDescription;
    }
    if (item.isRecommended) {
      group.isRecommended = true;
    }
    if (item.startDateRaw && (!group.startDate || item.startDateRaw < group.startDate)) {
      group.startDate = item.startDateRaw;
    }
    if (item.endDateRaw && (!group.endDate || item.endDateRaw > group.endDate)) {
      group.endDate = item.endDateRaw;
    }
  });
  return Array.from(groups.values())
    .map((group) => ({ ...group, filterIds: Array.from(group.filterIds) }))
    .sort((left, right) => String(left.startDate).localeCompare(String(right.startDate)));
}

function scheduleItemIdFromApplication(application) {
  if (!application) {
    return "";
  }
  if (application.lessonId) {
    return `lesson-${application.lessonId}`;
  }
  if (application.eventId) {
    return `event-${application.eventId}`;
  }
  return "";
}

function ApplicationCard({ item, language, labels, onApply }) {
  const isApplied = Boolean(item.isApplied);
  const isApplyDisabled = isApplied || Boolean(item.isApplyStatusLoading);

  return (
    <article
      className={`swing-frame grid gap-5 rounded-sm bg-swing-paper/92 p-6 transition hover:-translate-y-0.5 ${
        item.isRecommended ? "border-swing-gold/70 bg-swing-cream/70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-swing-teal/40 bg-swing-mint/50 px-3 py-1 text-xs font-medium text-swing-teal-deep">
              {item.eventType}
            </span>
            {item.recurrence ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-swing-teal/25 bg-swing-cream/70 px-3 py-1 text-xs font-medium text-swing-teal-deep">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {item.recurrence}
              </span>
            ) : null}
            {item.isRecommended ? (
              <span className="rounded-full border border-swing-gold/60 bg-swing-gold/30 px-3 py-1 text-xs font-medium text-swing-burgundy">
                {labels.recommended}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-swing-ink">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-swing-muted">{item.description}</p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow tone="swing" label={labels.details.date} value={item.date} />
        <DetailRow tone="swing" label={labels.details.time} value={item.time} />
        <DetailRow tone="swing" label={labels.details.location} value={item.location} />
        <DetailRow
          tone="swing"
          label={labels.details.price}
          value={<PriceValue price={item.price} note={[item.entranceFeeNote, item.paymentNote].filter(Boolean).join(" ")} />}
        />
        <DetailRow tone="swing" label={labels.details.teacher} value={item.teacher} />
      </dl>

      {item.requiresLevelNotice ? (
        <p className="rounded-sm border border-swing-teal/35 bg-swing-mint/45 px-4 py-3 text-sm leading-6 text-swing-teal-deep">
          {labels.levelNotice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!isApplyDisabled) {
            onApply(item);
          }
        }}
        disabled={isApplyDisabled}
        className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-medium tracking-wide transition focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper ${
          isApplied
            ? "cursor-default border border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
            : item.isApplyStatusLoading
              ? "cursor-wait border border-swing-border/25 bg-swing-cream/60 text-swing-muted/60"
              : "bg-swing-teal-deep text-swing-paper shadow-frame hover:bg-swing-teal"
        }`}
      >
        {isApplied ? labels.appliedButton : labels.applyButton}
      </button>
    </article>
  );
}

function RecurrenceBadge({ recurrence }) {
  if (!recurrence) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-swing-teal/25 bg-swing-cream/70 px-3 py-1 text-xs font-medium text-swing-teal-deep">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      {recurrence}
    </span>
  );
}

// One card per event. Clicking it opens EventLessonsModal to pick a class.
function EventCard({ group, language, labels, onSelect }) {
  const appliedCount = group.lessons.filter((lesson) => lesson.isApplied).length;

  return (
    <article
      className={`swing-frame grid gap-5 rounded-sm bg-swing-paper/92 p-6 transition hover:-translate-y-0.5 ${
        group.isRecommended ? "border-swing-gold/70 bg-swing-cream/70" : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-swing-teal/40 bg-swing-mint/50 px-3 py-1 text-xs font-medium text-swing-teal-deep">
            {group.eventType}
          </span>
          <RecurrenceBadge recurrence={group.recurrence} />
          {group.isRecommended ? (
            <span className="rounded-full border border-swing-gold/60 bg-swing-gold/30 px-3 py-1 text-xs font-medium text-swing-burgundy">
              {labels.recommended}
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-swing-ink">{group.title}</h3>
        {group.description ? (
          <p className="mt-3 text-sm leading-7 text-swing-muted">{group.description}</p>
        ) : null}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow tone="swing" label={labels.details.date} value={formatDateRange(group.startDate, group.endDate, language)} />
        <DetailRow
          tone="swing"
          label={labels.details.event}
          value={
            appliedCount > 0
              ? `${labels.classCountLabel(group.lessons.length)} · ${appliedCount}/${group.lessons.length}`
              : labels.classCountLabel(group.lessons.length)
          }
        />
      </dl>

      <button
        type="button"
        onClick={() => onSelect(group)}
        className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-swing-teal-deep px-5 text-sm font-medium tracking-wide text-swing-paper shadow-frame transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper"
      >
        {labels.viewClasses}
      </button>
    </article>
  );
}

// Brief class list for a single event; picking a class hands off to the apply modal.
function EventLessonsModal({ group, labels, onClose, onSelectLesson }) {
  if (!group) {
    return null;
  }

  return (
    <div
      className="swing-modal-scrim fixed inset-0 z-[105] flex items-end justify-center bg-swing-ink/55 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-lessons-title"
    >
      <div className="swing-modal-panel max-h-[calc(100vh-32px)] w-full max-w-xl overflow-y-auto rounded-3xl border border-swing-border/20 bg-swing-paper p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-swing-muted/70">{group.eventType}</p>
            <h2 id="event-lessons-title" className="mt-2 text-2xl font-semibold tracking-tight text-swing-ink">
              {group.title}
            </h2>
            {group.description ? (
              <p className="mt-2 text-sm leading-6 text-swing-ink/75">{group.description}</p>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-swing-muted">{labels.selectClassIntro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-swing-border/30 bg-swing-paper text-sm font-semibold text-swing-ink transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            aria-label={labels.closeModal}
          >
            X
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {group.lessons.map((lesson) => {
            const isApplied = Boolean(lesson.isApplied);
            const isDisabled = isApplied || Boolean(lesson.isApplyStatusLoading);
            return (
              <div
                key={lesson.id}
                className="swing-frame grid gap-3 rounded-sm bg-swing-paper/92 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-swing-ink">{lesson.title}</h3>
                    {lesson.isRecommended ? (
                      <span className="rounded-full border border-swing-gold/60 bg-swing-gold/30 px-2 py-0.5 text-[11px] font-medium text-swing-burgundy">
                        {labels.recommended}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-swing-muted">
                    <span>{lesson.date}</span>
                    <span>{lesson.time}</span>
                    <span><PriceValue price={lesson.price} note={lesson.entranceFeeNote} /></span>
                    {lesson.teacher ? <span>{lesson.teacher}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onSelectLesson(lesson);
                    }
                  }}
                  disabled={isDisabled}
                  className={`inline-flex min-h-[42px] items-center justify-center rounded-full px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-swing-teal ${
                    isApplied
                      ? "cursor-default border border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
                      : lesson.isApplyStatusLoading
                        ? "cursor-wait border border-swing-border/25 bg-swing-cream/60 text-swing-muted/60"
                        : "bg-swing-teal-deep text-swing-paper hover:bg-swing-teal"
                  }`}
                >
                  {isApplied ? labels.appliedButton : labels.applyButton}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScheduleAndApplicationSection({
  language,
  scheduleSection,
  labels,
  items,
  isLoading,
  error,
  activeFilter,
  onFilterChange,
  onSelectEvent,
}) {
  const filteredItems =
    activeFilter === "all" ? items : items.filter((item) => item.filterIds.includes(activeFilter));
  const hasItems = items.length > 0;

  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-display text-sm tracking-[0.2em] text-swing-teal">{scheduleSection.eyebrow}</p>
        <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-snug text-swing-ink md:text-[2.6rem]">
          {scheduleSection.title}
        </h2>
        <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-swing-muted">
          {scheduleSection.body.map((paragraph) => (
            <p key={`${language}-schedule-${paragraph}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="scroll-mt-24">
        <div className="mt-12">
          <div className="mb-3 text-center text-xs uppercase tracking-frame text-swing-muted">
            {labels.filtersTitle}
          </div>
          <div className="flex justify-start gap-2 overflow-x-auto pb-2 md:justify-center">
            {labels.filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-cream ${
                  activeFilter === filter.id
                    ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                    : "border-swing-border/35 bg-swing-paper/80 text-swing-ink hover:bg-swing-cream"
                }`}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="swing-frame mt-8 rounded-sm bg-swing-paper/85 px-5 py-10 text-center text-sm text-swing-muted">
            {labels.loading}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="swing-frame mt-8 rounded-sm border-swing-burgundy/40 bg-swing-coral/20 px-5 py-10 text-center text-sm leading-6 text-swing-burgundy">
            {labels.loadError}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {filteredItems.map((group) => (
              <EventCard key={group.id} group={group} language={language} labels={labels} onSelect={onSelectEvent} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <div className="swing-frame mt-8 rounded-sm bg-swing-paper/85 px-5 py-10 text-center text-sm text-swing-muted">
            {hasItems ? labels.noResults : labels.empty}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ApplicationModal({ item, language, labels, detailLabels, authState, onClose, onSubmitted, onAlreadyApplied }) {
  const [form, setForm] = useState({ name: "", requestMemo: "", danceRole: "" });
  const [isNameHelpOpen, setIsNameHelpOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const isAuthenticated = Boolean(authState?.authenticated);
  const authenticatedApplicantName = memberApplicationName(authState);

  useEffect(() => {
    setForm({
      name: isAuthenticated ? authenticatedApplicantName : "",
      requestMemo: "",
      danceRole: "",
    });
    setError("");
    setIsNameHelpOpen(false);
    setIsSubmitting(false);
    setSubmittedApplication(null);
  }, [item]);

  useEffect(() => {
    if (!item || !isAuthenticated) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      name: authenticatedApplicantName,
    }));
  }, [authenticatedApplicantName, isAuthenticated, item]);

  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const shouldShowMapLinks = item.addressInfoEnabled && (item.googleMapUrl || item.naverMapUrl);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const applicantName = isAuthenticated ? authenticatedApplicantName : form.name.trim();

    if (!applicantName) {
      setError(labels.required);
      return;
    }
    if (item.roleSelectionEnabled && !form.danceRole) {
      setError(labels.danceRoleRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const savedApplication = await publicScheduleApi.createApplication({
        eventId: item.target.eventId,
        lessonId: item.target.lessonId,
        applicantName,
        requestMemo: form.requestMemo.trim(),
        languageCode: language,
        danceRole: item.roleSelectionEnabled ? form.danceRole : null,
      });
      setSubmittedApplication(savedApplication);
      onSubmitted?.(savedApplication);
    } catch (nextError) {
      if (isAuthenticated && nextError.status === 409) {
        setError(labels.alreadyAppliedError);
        onAlreadyApplied?.(item);
      } else {
        setError(nextError.message || labels.submitError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="swing-modal-scrim fixed inset-0 z-[110] flex items-end justify-center bg-swing-ink/55 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-modal-title"
    >
      <div className="swing-modal-panel max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-swing-border/20 bg-swing-paper p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-swing-muted/70">
              {item.eventType}
            </p>
            <h2 id="application-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-swing-ink">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-swing-border/30 bg-swing-paper text-sm font-semibold text-swing-ink transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            aria-label={labels.close}
          >
            X
          </button>
        </div>

        <dl className="mt-6 grid gap-4 rounded-3xl border border-swing-border/30 bg-swing-cream/40 p-5 sm:grid-cols-2">
          <DetailRow label={detailLabels.details.date} value={item.date} />
          <DetailRow label={detailLabels.details.time} value={item.time} />
          <DetailRow label={detailLabels.details.location} value={item.location} />
          <DetailRow label={detailLabels.details.price} value={<PriceValue price={item.price} note={[item.entranceFeeNote, item.paymentNote].filter(Boolean).join(" ")} />} />
          <DetailRow label={detailLabels.details.teacher} value={item.teacher} />
        </dl>

        <p className="mt-5 text-sm leading-7 text-swing-ink/70">{item.description}</p>

        {item.requiresLevelNotice ? (
          <p className="mt-4 rounded-2xl border border-swing-teal/30 bg-swing-teal/10 px-4 py-3 text-sm leading-6 text-swing-teal-deep">
            {detailLabels.levelNotice}
          </p>
        ) : null}

        {submittedApplication ? (
          <div className="mt-6 rounded-3xl border border-swing-sage bg-swing-sage/40 p-5">
            <section>
              <h3 className="text-lg font-semibold text-swing-teal-deep">{labels.successTitle}</h3>
            </section>
            <section className="mt-4 border-t border-swing-sage pt-4">
              <div className="text-sm font-semibold text-swing-teal-deep">{labels.noticeTitle}</div>
              <p className="mt-2 text-sm leading-6 text-swing-teal-deep/75">{labels.noticeBody}</p>
              <a
                href="https://open.kakao.com/o/gdODdZIe"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-swing-sage bg-swing-paper px-3 text-sm font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
              >
                {labels.announcementRoom}
              </a>
            </section>
            <section className="mt-4 border-t border-swing-sage pt-4">
              <div className="text-sm font-semibold text-swing-teal-deep">{labels.contactTitle}</div>
              <p className="mt-2 text-sm leading-6 text-swing-teal-deep/75">{labels.contactBody}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-swing-teal-deep/55">
                    {labels.kakaoTalk}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-swing-teal-deep">
                    <div>{labels.koreanContact}</div>
                    <div>{labels.englishContact}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-swing-teal-deep/55">
                    Instagram
                  </div>
                  <a
                    href="https://www.instagram.com/swingpopseoul"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-swing-sage bg-swing-paper px-3 text-sm font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
                  >
                    {labels.instagramDm}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-swing-teal-deep/75">{labels.announcementQuestion}</p>
            </section>
            {shouldShowMapLinks ? (
              <section className="mt-4 border-t border-swing-sage pt-4">
                <div className="text-sm font-semibold text-swing-teal-deep">{labels.mapTitle}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.googleMapUrl ? (
                    <a
                      href={item.googleMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-swing-sage bg-swing-paper px-3 text-sm font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
                    >
                      {labels.googleMaps}
                    </a>
                  ) : null}
                  {item.naverMapUrl ? (
                    <a
                      href={item.naverMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-swing-sage bg-swing-paper px-3 text-sm font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
                    >
                      {labels.naverMap}
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
            >
              {labels.chooseAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-swing-ink/75">
                  {labels.nameLabel}
                  <button
                    type="button"
                    onClick={() => setIsNameHelpOpen((current) => !current)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-swing-border/30 bg-swing-cream/50 text-xs font-bold text-swing-teal-deep transition hover:bg-swing-cream/70 focus:outline-none focus:ring-2 focus:ring-swing-teal"
                    aria-label={labels.nameLabel}
                    aria-expanded={isNameHelpOpen}
                  >
                    ?
                  </button>
                </span>
                {isNameHelpOpen ? (
                  <div className="mt-2 rounded-2xl border border-swing-border/30 bg-swing-cream/50 px-4 py-3 text-xs leading-5 text-swing-ink/75">
                    {labels.nameHelp.map((line) => (
                      <p key={line} className="mt-2 first:mt-0">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={labels.namePlaceholder}
                  readOnly={isAuthenticated}
                  className="swing-field mt-2 min-h-[48px] w-full rounded-2xl border px-4 text-sm outline-none transition"
                />
                {isAuthenticated ? (
                  <span className="mt-2 block text-xs leading-5 text-swing-ink/55">
                    {labels.nameManagedBySettings}
                  </span>
                ) : null}
              </label>
              {item.roleSelectionEnabled ? (
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-swing-ink/75">{labels.danceRoleLabel}</span>
                    <select
                      name="danceRole"
                      value={form.danceRole}
                      onChange={handleChange}
                      className="swing-field mt-2 min-h-[48px] w-full rounded-2xl border px-4 text-sm outline-none transition"
                    >
                      <option value="">{labels.danceRolePlaceholder}</option>
                      {Object.entries(labels.danceRoles).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-3 rounded-2xl border border-swing-border/30 bg-swing-cream/40 px-4 py-3 text-sm leading-7 text-swing-ink/75">
                    {labels.danceRoleGuide.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-swing-ink/75">{labels.requestMemoLabel}</span>
                <textarea
                  name="requestMemo"
                  value={form.requestMemo}
                  onChange={handleChange}
                  rows={4}
                  placeholder={labels.requestMemoPlaceholder}
                  className="swing-field mt-2 w-full rounded-2xl border px-4 py-3 text-sm leading-6 outline-none transition"
                />
                <span className="mt-2 block text-xs leading-5 text-swing-ink/55">
                  {labels.requestMemoHelp}
                </span>
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
              >
                {labels.close}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
              >
                {isSubmitting ? labels.submitting : labels.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MemberSettingsPage({ authState, isLoading, language, onLogin, onBack, onSaved, onWithdraw, onPrivacy }) {
  const labels = SETTINGS_COPY[language] ?? SETTINGS_COPY.ko;
  const [form, setForm] = useState({ nickname: "", preferredLanguage: "KO" });
  const [settings, setSettings] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authState?.authenticated) {
      setSettings(null);
      setForm({ nickname: "", preferredLanguage: "KO" });
      return undefined;
    }

    let isMounted = true;
    setIsSettingsLoading(true);
    setNotice("");
    setError("");

    authApi
      .getSettings()
      .then((nextSettings) => {
        if (!isMounted) {
          return;
        }
        setSettings(nextSettings);
        setForm({
          nickname: nextSettings?.nickname || "",
          preferredLanguage: nextSettings?.preferredLanguage || "KO",
        });
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError.message || labels.loadError);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSettingsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authState?.authenticated, labels.loadError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setNotice("");
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    authApi
      .updateSettings({
        nickname: form.nickname,
        preferredLanguage: form.preferredLanguage,
      })
      .then((savedSettings) => {
        setSettings(savedSettings);
        setForm({
          nickname: savedSettings?.nickname || "",
          preferredLanguage: savedSettings?.preferredLanguage || "KO",
        });
        setNotice(labels.saved);
        onSaved(savedSettings);
      })
      .catch((nextError) => {
        setError(nextError.message || labels.saveError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setError("");
    setNotice("");

    try {
      await authApi.withdraw();
      setIsWithdrawConfirmOpen(false);
      onWithdraw(labels.withdrawSuccess);
    } catch (nextError) {
      setError(nextError.message || labels.withdrawError);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!authState?.authenticated) {
    return (
      <main className="min-h-screen px-5 py-24">
        <section className="mx-auto max-w-xl rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-swing-ink">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            >
              {labels.back}
            </button>
          </div>
          <div className="mt-5 text-right">
            <a
              href="/privacy"
              onClick={onPrivacy}
              className="text-xs font-medium text-swing-ink/45 underline decoration-swing-ink/20 underline-offset-2 transition hover:text-swing-ink/70"
            >
              {labels.privacyLink}
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-20 sm:py-24">
      <section className="mx-auto max-w-2xl rounded-3xl border border-swing-border/20 bg-swing-paper/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-swing-ink sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-4 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {labels.back}
          </button>
        </div>

        {isSettingsLoading ? (
          <div className="mt-8 rounded-2xl border border-swing-border/20 bg-swing-cream/50 px-4 py-3 text-sm text-swing-ink/65">
            ...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-swing-ink/70">{labels.email}</span>
              <input
                type="text"
                readOnly
                value={settings?.email || authState?.email || ""}
                className="swing-field mt-2 min-h-[46px] w-full rounded-2xl border px-4 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-swing-ink/70">{labels.displayName}</span>
              <input
                type="text"
                readOnly
                value={settings?.displayName || authState?.displayName || ""}
                className="swing-field mt-2 min-h-[46px] w-full rounded-2xl border px-4 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-swing-ink/70">{labels.nickname}</span>
              <input
                name="nickname"
                type="text"
                value={form.nickname}
                onChange={handleChange}
                maxLength={20}
                placeholder={labels.nicknamePlaceholder}
                className="swing-field mt-2 min-h-[46px] w-full rounded-2xl border px-4 text-sm outline-none transition"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-swing-ink/70">{labels.preferredLanguage}</span>
              <select
                name="preferredLanguage"
                value={form.preferredLanguage}
                onChange={handleChange}
                className="swing-field mt-2 min-h-[46px] w-full rounded-2xl border px-4 text-sm outline-none transition"
              >
                <option value="KO">{labels.korean}</option>
                <option value="EN">{labels.english}</option>
              </select>
            </label>

            {notice ? (
              <div className="rounded-2xl border border-swing-sage bg-swing-sage/40 px-4 py-3 text-sm text-swing-teal-deep">
                {notice}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 sm:w-auto"
              >
                {isSaving ? labels.saving : labels.save}
              </button>
            </div>

            <div className="mt-4 border-t border-swing-border/20 pt-5">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setIsWithdrawConfirmOpen(true);
                }}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-red-100 bg-swing-paper px-3 text-xs font-semibold text-red-700/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {labels.withdrawButton}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 text-right">
          <a
            href="/privacy"
            onClick={onPrivacy}
            className="text-xs font-medium text-swing-ink/45 underline decoration-swing-ink/20 underline-offset-2 transition hover:text-swing-ink/70"
          >
            {labels.privacyLink}
          </a>
        </div>
      </section>

      {isWithdrawConfirmOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-swing-ink/45 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-confirm-title"
        >
          <section className="w-full max-w-md rounded-3xl border border-swing-border/20 bg-swing-paper p-5 shadow-2xl sm:p-6">
            <h2 id="withdraw-confirm-title" className="text-xl font-semibold tracking-tight text-swing-ink">
              {labels.withdrawConfirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.withdrawConfirmBody}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsWithdrawConfirmOpen(false)}
                disabled={isWithdrawing}
                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-4 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:text-swing-muted/45"
              >
                {labels.withdrawCancel}
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-red-700 px-4 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isWithdrawing ? labels.withdrawing : labels.withdrawConfirm}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function MyClassesPage({ authState, isLoading, language, onLogin, onBack, onUnreadChanged }) {
  const labels = MY_CLASSES_COPY[language] ?? MY_CLASSES_COPY.ko;
  const [applications, setApplications] = useState([]);
  const [noticesByLessonId, setNoticesByLessonId] = useState({});
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [noticeError, setNoticeError] = useState("");

  const loadLessonNotices = useCallback(async (nextApplications) => {
    const lessonIds = [...new Set(
      nextApplications
        .map(lessonIdFromApplication)
        .filter((lessonId) => lessonId !== null)
    )];
    if (lessonIds.length === 0) {
      setNoticesByLessonId({});
      return;
    }

    try {
      const noticeEntries = await Promise.all(
        lessonIds.map(async (lessonId) => {
          const lessonNotices = await authApi.getMyLessonNotices(lessonId);
          return [lessonId, Array.isArray(lessonNotices) ? lessonNotices : []];
        })
      );
      const nextNoticesByLessonId = Object.fromEntries(noticeEntries);
      setNoticesByLessonId(nextNoticesByLessonId);
      setNoticeError("");

      const visibleNoticeLessonIds = noticeEntries
        .filter(([, lessonNotices]) => lessonNotices.length > 0)
        .map(([lessonId]) => lessonId);
      if (visibleNoticeLessonIds.length > 0) {
        await Promise.allSettled(
          visibleNoticeLessonIds.map((lessonId) => authApi.markMyLessonNoticesRead(lessonId))
        );
        await onUnreadChanged?.();
      }
    } catch (nextError) {
      setNoticesByLessonId({});
      setNoticeError(nextError.message || labels.noticeLoadError);
    }
  }, [labels.noticeLoadError, onUnreadChanged]);

  const loadApplications = useCallback(async () => {
    setIsApplicationsLoading(true);
    setError("");
    setNoticeError("");

    try {
      const nextApplications = await authApi.getMyClassApplications(language);
      const normalizedApplications = Array.isArray(nextApplications) ? nextApplications : [];
      setApplications(normalizedApplications);
      await loadLessonNotices(normalizedApplications);
    } catch (nextError) {
      setApplications([]);
      setNoticesByLessonId({});
      setError(nextError.message || labels.loadError);
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [language, labels.loadError, loadLessonNotices]);

  useEffect(() => {
    if (!authState?.authenticated) {
      setApplications([]);
      setNoticesByLessonId({});
      return;
    }

    loadApplications();
  }, [authState?.authenticated, loadApplications]);

  if (!authState?.authenticated) {
    return (
      <main className="min-h-screen px-5 py-24">
        <section className="mx-auto max-w-xl rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-swing-ink">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            >
              {labels.back}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-20 sm:py-24">
      <section className="mx-auto max-w-3xl rounded-3xl border border-swing-border/20 bg-swing-paper/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-swing-ink sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-4 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8">
          {isApplicationsLoading ? (
            <div className="rounded-3xl border border-swing-border/20 bg-swing-cream/35 px-5 py-8 text-center text-sm text-swing-ink/60">
              {labels.loading}
            </div>
          ) : null}

          {!isApplicationsLoading && error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isApplicationsLoading && !error && applications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-swing-border/30 bg-swing-cream/30 px-5 py-8 text-center text-sm text-swing-ink/60">
              {labels.empty}
            </div>
          ) : null}

          {!isApplicationsLoading && !error && noticeError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {noticeError}
            </div>
          ) : null}

          {!isApplicationsLoading && !error && applications.length > 0 ? (
            <div className="grid gap-4">
              {applications.map((application) => {
                const lessonId = lessonIdFromApplication(application);
                const notices = lessonId === null ? [] : noticesByLessonId[lessonId] || [];
                return (
                  <article
                    key={application.applicationId}
                    className="rounded-3xl border border-swing-border/20 bg-swing-paper p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex min-h-[28px] items-center rounded-full border border-swing-sage bg-swing-sage/40 px-3 text-xs font-semibold text-swing-teal-deep">
                          {labels.status}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold tracking-tight text-swing-ink">
                          {application.classTitle}
                        </h2>
                      </div>
                    </div>
                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                      <DetailRow label={labels.date} value={formatClassDate(application.classDate, language)} />
                      <DetailRow label={labels.role} value={formatClassRole(application.role, labels)} />
                      <DetailRow label={labels.appliedAt} value={formatMessageDate(application.appliedAt, language)} />
                    </dl>
                    {notices.length > 0 ? (
                      <section className="mt-5 rounded-2xl border border-swing-border/20 bg-swing-cream/35 px-4 py-3">
                        <div className="text-xs font-semibold text-swing-ink/50">{labels.notices}</div>
                        <div className="mt-3 grid gap-3">
                          {notices.map((notice) => (
                            <article key={notice.id} className="rounded-2xl border border-swing-border/20 bg-swing-paper px-4 py-3">
                              <div className="text-xs font-semibold text-swing-ink/50">
                                {formatLessonNoticeAuthor(notice, labels)} · {formatMessageDate(notice.createdAt, language)}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-swing-ink/75">
                                {notice.content}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MemberMessagesPage({ authState, isLoading, language, onLogin, onBack, onUnreadChanged }) {
  const labels = MEMBER_MESSAGES_COPY[language] ?? MEMBER_MESSAGES_COPY.ko;
  const [thread, setThread] = useState({ threadId: null, messages: [] });
  const [content, setContent] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMessages = useCallback(async () => {
    setIsMessagesLoading(true);
    setError("");

    try {
      const nextThread = await authApi.getMyMessages();
      setThread({
        threadId: nextThread?.threadId ?? null,
        messages: Array.isArray(nextThread?.messages) ? nextThread.messages : [],
      });
      await onUnreadChanged?.();
    } catch (nextError) {
      setError(nextError.message || labels.loadError);
    } finally {
      setIsMessagesLoading(false);
    }
  }, [labels.loadError, onUnreadChanged]);

  useEffect(() => {
    if (!authState?.authenticated) {
      setThread({ threadId: null, messages: [] });
      setContent("");
      return;
    }

    loadMessages();
  }, [authState?.authenticated, loadMessages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError(labels.sendError);
      return;
    }

    setIsSending(true);
    setError("");
    setNotice("");

    try {
      await authApi.sendMyMessage({ content: normalizedContent });
      setContent("");
      setNotice(labels.sent);
      await loadMessages();
    } catch (nextError) {
      setError(nextError.message || labels.sendError);
    } finally {
      setIsSending(false);
    }
  };

  if (!authState?.authenticated) {
    return (
      <main className="min-h-screen px-5 py-24">
        <section className="mx-auto max-w-xl rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-swing-ink">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            >
              {labels.back}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-20 sm:py-24">
      <section className="mx-auto max-w-3xl rounded-3xl border border-swing-border/20 bg-swing-paper/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-swing-ink sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-4 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-swing-border/20 bg-swing-cream/30 p-4 sm:p-5">
          {isMessagesLoading ? (
            <div className="py-8 text-center text-sm text-swing-ink/60">{labels.loading}</div>
          ) : thread.messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-swing-ink/60">{labels.empty}</div>
          ) : (
            <div className="grid gap-4">
              {thread.messages.map((message) => {
                const isMember = message.senderType === "MEMBER";
                return (
                  <article
                    key={message.id}
                    className={`flex ${isMember ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${
                        isMember
                          ? "bg-swing-teal-deep text-swing-paper"
                          : "border border-swing-border/20 bg-swing-paper text-swing-ink"
                      }`}
                    >
                      <div className={`text-xs font-semibold ${isMember ? "text-swing-paper/75" : "text-swing-ink/55"}`}>
                        {isMember ? labels.member : formatStaffSenderLabel(message, labels)}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      <div className={`mt-2 text-[11px] ${isMember ? "text-swing-paper/65" : "text-swing-ink/45"}`}>
                        {formatMessageDate(message.createdAt, language)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setError("");
              setNotice("");
            }}
            maxLength={2000}
            rows={4}
            placeholder={labels.placeholder}
            className="swing-field w-full rounded-2xl border px-4 py-3 text-sm leading-6 outline-none transition"
          />

          {notice ? (
            <div className="mt-3 rounded-2xl border border-swing-sage bg-swing-sage/40 px-4 py-3 text-sm text-swing-teal-deep">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 sm:w-auto"
            >
              {isSending ? labels.sending : labels.send}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function MyPage({
  authState,
  isLoading,
  isPending,
  language,
  onLogin,
  onBack,
  onMyClasses,
  onMessages,
  onSettings,
  onLogout,
  onPrivacy,
  canInstall = false,
  isInstalled = false,
  showIosGuide = false,
  onInstall,
  messageUnreadCount = 0,
  classNoticeUnreadCount = 0,
}) {
  const labels = MY_PAGE_COPY[language] ?? MY_PAGE_COPY.ko;
  const displayName = memberApplicationName(authState);
  const email = authState?.email || "";
  const menuActions = {
    classes: onMyClasses,
    messages: onMessages,
    settings: onSettings,
  };

  if (!authState?.authenticated) {
    return (
      <main className="min-h-screen px-5 py-24">
        <section className="mx-auto max-w-xl rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-swing-ink">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-swing-ink/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper px-5 text-sm font-semibold text-swing-ink shadow-sm transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            >
              {labels.back}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-20 sm:py-24">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-swing-ink sm:text-4xl">{labels.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-swing-ink/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper/85 px-4 text-sm font-semibold text-swing-ink shadow-sm backdrop-blur transition hover:bg-swing-paper focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-swing-muted/70">
            {labels.accountLabel}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-swing-ink">{displayName}</div>
          {email ? (
            <div className="mt-2 text-sm text-swing-ink/55">
              <span className="font-semibold">{labels.emailLabel}</span>
              <span className="mx-2 text-swing-ink/25">/</span>
              <span>{email}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {labels.menu.map((item) => {
            const unreadCount =
              item.id === "messages"
                ? messageUnreadCount
                : item.id === "classes"
                  ? classNoticeUnreadCount
                  : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={menuActions[item.id]}
                className="min-h-[132px] rounded-3xl border border-swing-border/20 bg-swing-paper/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-swing-border/30 hover:bg-swing-paper hover:shadow-md focus:outline-none focus:ring-2 focus:ring-swing-teal"
              >
                <span className="flex items-center justify-between gap-3 text-lg font-semibold tracking-tight text-swing-ink">
                  <span>{item.title}</span>
                  {unreadCount > 0 ? (
                    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-swing-teal-deep px-2 py-0.5 text-xs font-bold text-swing-paper">
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 block text-sm leading-6 text-swing-ink/62">{item.description}</span>
              </button>
            );
          })}
        </div>

        {/* Stays put once installed, saying so, rather than vanishing on success
            and reading as a feature that disappeared. Installed state is per
            device, so the same account on a second phone sees it live again.
            Hidden only where no install exists to speak of — a browser that
            never offers one, where any wording would be a dead end. */}
        {canInstall || isInstalled || showIosGuide ? (
          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-swing-border/20 bg-swing-paper/85 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="text-lg font-semibold tracking-tight text-swing-ink">{labels.installTitle}</div>
              <p className="mt-2 text-sm leading-6 text-swing-ink/62">
                {isInstalled
                  ? labels.installedDescription
                  : showIosGuide
                    ? labels.iosInstallDescription
                    : labels.installDescription}
              </p>
            </div>
            {/* On iOS the steps are the whole card: there is no prompt to fire,
                so a button would do nothing at all. */}
            {showIosGuide ? null : (
              <button
                type="button"
                onClick={onInstall}
                disabled={isInstalled}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper shadow-sm transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-default disabled:border disabled:border-swing-border/30 disabled:bg-swing-cream/60 disabled:text-swing-ink/55 disabled:shadow-none disabled:hover:bg-swing-cream/60"
              >
                {isInstalled ? labels.installedAction : labels.installAction}
              </button>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onLogout}
            disabled={isPending}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-swing-border/30 bg-swing-paper/70 px-4 text-sm font-semibold text-swing-ink/70 shadow-sm backdrop-blur transition hover:bg-swing-paper hover:text-swing-ink focus:outline-none focus:ring-2 focus:ring-swing-teal disabled:cursor-not-allowed disabled:text-swing-muted/45"
          >
            {isPending ? labels.loggingOut : labels.logout}
          </button>
        </div>

        <div className="mt-5 text-right">
          <a
            href="/privacy"
            onClick={onPrivacy}
            className="text-xs font-medium text-swing-ink/45 underline decoration-swing-ink/20 underline-offset-2 transition hover:text-swing-ink/70"
          >
            {labels.privacyLink}
          </a>
        </div>
      </section>
    </main>
  );
}

// `tone` only swaps colors. The default keeps the existing look on Corkboard
// and member subpages, which are outside the public redesign.
function AuthControl({ authState, isLoading, isPending, language, onLogin, onMyPage, tone = "default" }) {
  const isAuthenticated = Boolean(authState?.authenticated);
  const labels = MY_PAGE_COPY[language] ?? MY_PAGE_COPY.ko;
  const toneClass =
    tone === "swing"
      ? "border-swing-border/30 bg-swing-teal-deep/95 text-swing-paper hover:bg-swing-teal focus:ring-swing-teal disabled:text-swing-paper/50"
      : "border-swing-border/30 bg-swing-paper/80 text-swing-ink hover:bg-swing-paper focus:ring-swing-teal disabled:text-swing-muted/45";

  return (
    // Mirrors SiteHeader's own row box — same max width, same padding, same
    // vertical padding — so the button lands exactly on the spacer the header
    // reserves for it, horizontally and vertically, at every breakpoint.
    // Hardcoded insets were used here before and drifted: `top-2` sat the button
    // 5px above the logo and language picker once the band grew to 63px.
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80]">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 sm:px-5 md:px-8">
        {/* 38px matches the language picker beside it, which is what makes the
            button share a centre line with the logo and the picker. */}
        <button
          type="button"
          onClick={isAuthenticated ? onMyPage : onLogin}
          disabled={isLoading || isPending}
          // Below `sm` the visible text is just "Google", so the full wording
          // has to reach screen readers some other way.
          aria-label={isAuthenticated ? undefined : labels.login}
          className={`pointer-events-auto inline-flex min-h-[38px] items-center justify-center rounded-full border px-3 text-xs font-medium shadow-sm backdrop-blur transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed sm:px-4 ${toneClass}`}
        >
          {isLoading || isPending ? (
            "..."
          ) : isAuthenticated ? (
            labels.topButton
          ) : (
            <>
              <span className="sm:hidden">{labels.loginShort}</span>
              <span className="hidden sm:inline">{labels.login}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function InAppBrowserNotice({ language, url, onClose }) {
  const labels = LOGIN_CONSENT_COPY[language] ?? LOGIN_CONSENT_COPY.ko;
  const [copyState, setCopyState] = useState("idle");

  const handleCopy = async () => {
    // Both paths can be refused inside a webview, so a failure has to say so
    // rather than leave the button looking untouched.
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      return;
    } catch {
      // Fall through to the legacy path.
    }

    const field = document.createElement("textarea");
    field.value = url;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }

    document.body.removeChild(field);
    setCopyState(copied ? "copied" : "failed");
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-swing-ink/45 px-4 backdrop-blur-sm">
      <section className="swing-frame w-full max-w-md rounded-sm bg-swing-paper/95 p-6">
        <h2 className="font-display text-xl font-bold tracking-tight text-swing-ink">{labels.inAppTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-swing-muted">{labels.inAppBody}</p>

        {/* Shown as selectable text too: copying can fail silently in a webview. */}
        <p className="mt-4 select-all break-all rounded-sm border border-swing-border/30 bg-swing-cream/50 px-3 py-2 text-xs leading-6 text-swing-ink/80">
          {url}
        </p>

        <p className="mt-3 text-xs leading-6 text-swing-muted">{labels.inAppHint}</p>

        {copyState === "failed" ? (
          <p className="mt-3 text-xs font-semibold leading-6 text-red-700">{labels.inAppCopyFailed}</p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-swing-border/30 bg-swing-paper px-5 text-sm font-medium tracking-wide text-swing-ink/80 transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {labels.inAppClose}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-swing-teal-deep px-5 text-sm font-medium tracking-wide text-swing-paper shadow-frame transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper"
          >
            {copyState === "copied" ? labels.inAppCopied : labels.inAppCopy}
          </button>
        </div>
      </section>
    </div>
  );
}

function LoginConsentPage({ language, onBack, onContinue, onPrivacy }) {
  const labels = LOGIN_CONSENT_COPY[language] ?? LOGIN_CONSENT_COPY.ko;
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <main className="swing-theme swing-paper mx-auto flex min-h-screen w-full max-w-2xl items-center px-5 py-24 text-swing-ink md:px-8">
      <section className="swing-frame w-full rounded-sm bg-swing-paper/92 p-6 sm:p-8">
        <p className="font-display text-sm tracking-[0.16em] text-swing-teal">{labels.eyebrow}</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{labels.title}</h1>
        <p className="mt-4 text-sm leading-7 text-swing-muted">{labels.description}</p>

        <div className="mt-6 space-y-3 rounded-sm border border-swing-border/25 bg-swing-cream/55 px-4 py-4 text-sm leading-7 text-swing-muted">
          <p>{labels.summary}</p>
          <p>{labels.noToken}</p>
          <a
            href="/privacy"
            onClick={onPrivacy}
            className="inline-flex text-sm font-medium text-swing-teal-deep underline decoration-swing-teal/30 underline-offset-2 transition hover:text-swing-ink"
          >
            {labels.privacyLink}
          </a>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-sm border border-swing-border/25 bg-swing-paper/85 px-4 py-4 text-sm leading-6 text-swing-ink/85 transition hover:border-swing-border/40 hover:bg-swing-cream/50">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(event) => setIsConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-swing-border/50 text-swing-teal-deep focus:ring-swing-teal"
          />
          <span>{labels.checkbox}</span>
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-swing-border/35 bg-swing-paper/85 px-5 text-sm font-medium text-swing-ink transition hover:bg-swing-cream focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper"
          >
            {labels.back}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!isConfirmed}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-swing-teal-deep px-5 text-sm font-medium tracking-wide text-swing-paper shadow-frame transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-paper disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-paper/60 disabled:shadow-none"
          >
            {labels.continue}
          </button>
        </div>
      </section>
    </main>
  );
}

function PrivacyPolicyPage({ language, onBack }) {
  const initialPolicyLanguage = language === "en" ? "en" : "ko";
  const [policyLanguage, setPolicyLanguage] = useState(initialPolicyLanguage);
  const labels = PRIVACY_POLICY_COPY[policyLanguage] ?? PRIVACY_POLICY_COPY.ko;

  useEffect(() => {
    setPolicyLanguage(language === "en" ? "en" : "ko");
  }, [language]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-24 text-swing-ink md:px-8 md:py-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-swing-border/30 bg-swing-paper/80 px-4 text-sm font-semibold text-swing-ink/70 shadow-sm backdrop-blur transition hover:bg-swing-paper hover:text-swing-ink focus:outline-none focus:ring-2 focus:ring-swing-teal"
        >
          {labels.back}
        </button>
        <div className="inline-flex rounded-full border border-swing-border/30 bg-swing-paper/80 p-1 shadow-sm backdrop-blur">
          {[
            { value: "ko", label: "한국어" },
            { value: "en", label: "English" },
          ].map((option) => {
            const isActive = policyLanguage === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPolicyLanguage(option.value)}
                className={`min-h-[32px] rounded-full px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-swing-teal ${
                  isActive ? "bg-swing-teal-deep text-swing-paper shadow-sm" : "text-swing-ink/60 hover:bg-swing-cream/50 hover:text-swing-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <article className="mt-8 rounded-3xl border border-swing-border/20 bg-swing-paper/90 p-6 shadow-sm backdrop-blur md:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-swing-muted/70">{labels.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{labels.title}</h1>
        <p className="mt-5 text-base leading-8 text-swing-ink/70">{labels.intro}</p>

        <div className="mt-8 space-y-8">
          {labels.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-swing-ink/70">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-swing-teal" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

// Asked once, right after signing in. Answering either way is the end of it:
// the offer lives on My Page from then on.
function InstallAskModal({ labels, isIosGuide, onInstall, onDismiss }) {
  useModalBackDismiss(true, "install-ask", onDismiss);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-ask-title"
      className="fixed inset-0 z-[115] flex items-end justify-center bg-swing-ink/55 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-3xl border border-swing-border/20 bg-swing-paper p-5 shadow-2xl sm:p-6">
        <h2 id="install-ask-title" className="text-xl font-semibold tracking-tight text-swing-ink">
          {labels.installAskTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-swing-ink/70">
          {isIosGuide ? labels.iosInstallDescription : labels.installAskBody}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          {/* Nothing to start on iOS, so acknowledging is the only answer there. */}
          {isIosGuide ? null : (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-swing-border/40 bg-swing-paper px-4 text-sm font-semibold text-swing-ink/75 transition hover:bg-swing-cream/50 focus:outline-none focus:ring-2 focus:ring-swing-teal"
            >
              {labels.installLater}
            </button>
          )}
          <button
            type="button"
            onClick={isIosGuide ? onDismiss : onInstall}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-swing-teal-deep px-5 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal"
          >
            {isIosGuide ? labels.installAskConfirm : labels.installAction}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicApp() {
  const [guestLanguage, setGuestLanguage] = useState(readStoredGuestLanguage);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [appliedScheduleItemIds, setAppliedScheduleItemIds] = useState([]);
  const [isAppliedScheduleLoading, setIsAppliedScheduleLoading] = useState(false);
  const [memberMessageUnreadCount, setMemberMessageUnreadCount] = useState(0);
  const [lessonNoticeUnreadCount, setLessonNoticeUnreadCount] = useState(0);
  const [authState, setAuthState] = useState({ authenticated: false });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthActionPending, setIsAuthActionPending] = useState(false);
  // Set only when an in-app browser cannot hand the login off to a real browser.
  const [inAppLoginUrl, setInAppLoginUrl] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [pendingLanguageOnboarding, setPendingLanguageOnboarding] = useState(false);
  const [currentPath, setCurrentPath] = useState(
    typeof window === "undefined" ? "/" : window.location.pathname
  );
  const previousPathRef = useRef(null);

  const applyAuthState = useCallback((nextAuthState) => {
    const normalizedAuthState = nextAuthState?.authenticated ? nextAuthState : { authenticated: false };
    setAuthState(normalizedAuthState);
    if (!normalizedAuthState.authenticated) {
      // Fall back to the stored guest choice rather than null. Auth resolving
      // as signed-out runs after mount, so nulling here threw away the
      // language the header picker had saved on a previous visit.
      setGuestLanguage(readStoredGuestLanguage());
      setAppliedScheduleItemIds([]);
      setIsAppliedScheduleLoading(false);
      setMemberMessageUnreadCount(0);
      setLessonNoticeUnreadCount(0);
    }

    return normalizedAuthState;
  }, []);

  const refreshAuthState = useCallback(async () => {
    const nextAuthState = await authApi.me();
    return applyAuthState(nextAuthState);
  }, [applyAuthState]);

  const loadMemberMessageUnreadCount = useCallback(async () => {
    if (!authState?.authenticated) {
      setMemberMessageUnreadCount(0);
      return 0;
    }

    try {
      const response = await authApi.getMyMessageUnreadCount();
      const count = Number(response?.count) || 0;
      setMemberMessageUnreadCount(count);
      return count;
    } catch (error) {
      if (error.status === 401) {
        setMemberMessageUnreadCount(0);
      }
      return 0;
    }
  }, [authState?.authenticated]);

  const loadLessonNoticeUnreadCount = useCallback(async () => {
    if (!authState?.authenticated) {
      setLessonNoticeUnreadCount(0);
      return 0;
    }

    try {
      const response = await authApi.getMyLessonNoticeUnreadCount();
      const count = Number(response?.count) || 0;
      setLessonNoticeUnreadCount(count);
      return count;
    } catch (error) {
      if (error.status === 401) {
        setLessonNoticeUnreadCount(0);
      }
      return 0;
    }
  }, [authState?.authenticated]);

  const loadAppliedScheduleItemIds = useCallback(async () => {
    if (!authState?.authenticated) {
      setAppliedScheduleItemIds([]);
      setIsAppliedScheduleLoading(false);
      return [];
    }

    setIsAppliedScheduleLoading(true);

    try {
      const nextAppliedScheduleItemIds = await authApi.getAppliedScheduleItemIds();
      const normalizedIds = Array.isArray(nextAppliedScheduleItemIds)
        ? nextAppliedScheduleItemIds.map((id) => String(id))
        : [];
      setAppliedScheduleItemIds(normalizedIds);
      return normalizedIds;
    } catch (primaryError) {
      try {
        const myApplications = await authApi.getMyClassApplications();
        const fallbackIds = Array.isArray(myApplications)
          ? myApplications
              .map((application) => application?.scheduleItemId)
              .filter(Boolean)
              .map((id) => String(id))
          : [];
        setAppliedScheduleItemIds(fallbackIds);
        return fallbackIds;
      } catch {
        if (primaryError.status === 401) {
          setAppliedScheduleItemIds([]);
        }
        return [];
      }
    } finally {
      setIsAppliedScheduleLoading(false);
    }
  }, [authState?.authenticated]);

  const markScheduleItemApplied = useCallback((scheduleItemId) => {
    if (!scheduleItemId) {
      return;
    }

    const normalizedScheduleItemId = String(scheduleItemId);
    setAppliedScheduleItemIds((currentIds) => (
      currentIds.includes(normalizedScheduleItemId)
        ? currentIds
        : [...currentIds, normalizedScheduleItemId]
    ));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    clearPersistedLanguagePreferences();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Each open modal owns a history entry, so back closes the one on top and
  // leaves the rest — the class list stays put while the apply modal above it
  // goes, and only the last press reaches the page behind them.
  useModalBackDismiss(Boolean(selectedEvent), "event-lessons", () => setSelectedEvent(null));
  useModalBackDismiss(Boolean(selectedApplication), "application", () => setSelectedApplication(null));

  useEffect(() => {
    if (!accountNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setAccountNotice(""), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [accountNotice]);

  useEffect(() => {
    let isMounted = true;

    setIsScheduleLoading(true);
    setScheduleError("");

    publicScheduleApi
      .findOpenSchedules()
      .then((items) => {
        if (isMounted) {
          setScheduleItems(Array.isArray(items) ? items : []);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setScheduleItems([]);
          setScheduleError(nextError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsScheduleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let resolvedAuth = { authenticated: false };

    authApi
      .me()
      .then((nextAuthState) => {
        if (isMounted) {
          resolvedAuth = applyAuthState(nextAuthState);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState({ authenticated: false });
        }
      })
      .finally(() => {
        if (isMounted) {
          if (window.location.pathname === "/oauth/success") {
            const isWelcome = new URLSearchParams(window.location.search).get("welcome") === "1";
            if (isWelcome && resolvedAuth?.authenticated) {
              setPendingLanguageOnboarding(true);
            }
            window.history.replaceState({}, "", "/");
            setCurrentPath("/");
          } else if (window.location.pathname === "/oauth/error") {
            const reason = new URLSearchParams(window.location.search).get("reason");
            if (reason === "account_restricted") {
              setAccountNotice(accountRestrictedMessage());
            }
            window.history.replaceState({}, "", "/");
            setCurrentPath("/");
          }
          setIsAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applyAuthState]);

  useEffect(() => {
    if (!authState?.authenticated) {
      setAppliedScheduleItemIds([]);
      setIsAppliedScheduleLoading(false);
      setMemberMessageUnreadCount(0);
      setLessonNoticeUnreadCount(0);
      return;
    }

    loadAppliedScheduleItemIds();
    loadMemberMessageUnreadCount();
    loadLessonNoticeUnreadCount();
  }, [authState?.authenticated, loadAppliedScheduleItemIds, loadLessonNoticeUnreadCount, loadMemberMessageUnreadCount]);

  const handleLanguageSelect = (nextLanguage) => {
    const nextPreferredLanguage = toMemberPreferredLanguage(nextLanguage);

    if (!authState?.authenticated) {
      setGuestLanguage(nextLanguage);
      writeStoredGuestLanguage(nextLanguage);
      return;
    }

    if (!nextPreferredLanguage) {
      return;
    }

    setIsAuthActionPending(true);
    authApi
      .updateSettings({
        nickname: authState.nickname || "",
        preferredLanguage: nextPreferredLanguage,
      })
      .then((savedSettings) => {
        setAuthState((currentAuthState) => ({
          ...currentAuthState,
          authenticated: true,
          memberId: savedSettings?.memberId ?? currentAuthState.memberId,
          email: savedSettings?.email ?? currentAuthState.email,
          displayName: savedSettings?.displayName ?? currentAuthState.displayName,
          nickname: savedSettings?.nickname ?? null,
          preferredLanguage: savedSettings?.preferredLanguage ?? nextPreferredLanguage,
          role: savedSettings?.role ?? currentAuthState.role,
        }));
        return refreshAuthState();
      })
      .catch(() => null)
      .finally(() => {
        setIsAuthActionPending(false);
      });
  };

  const handleGoogleLogin = () => {
    if (typeof window === "undefined") {
      return;
    }

    const loginUrl = authApi.googleLoginUrl();
    const { isInApp, platform } = detectInAppBrowser();

    if (!isInApp) {
      window.location.href = loginUrl;
      return;
    }

    const absoluteUrl = new URL(loginUrl, window.location.origin).href;

    if (platform === "android") {
      window.location.href = buildChromeIntentUrl(absoluteUrl);
      return;
    }

    setInAppLoginUrl(absoluteUrl);
  };

  const handleLogin = () => {
    navigateToPath("/login");
  };

  const navigateToPath = (path) => {
    if (typeof window === "undefined") {
      return;
    }

    const commit = () => {
      previousPathRef.current = currentPath;
      window.history.pushState({}, "", path);
      setCurrentPath(path);
    };

    // A reduced-motion request covers scrolling as much as it covers the
    // cross-fade, and a smooth scroll running underneath a cross-fade reads as
    // a jolt, so only the un-animated path keeps the smooth scroll.
    const jumpToTop = (behavior) => window.scrollTo({ top: 0, behavior });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit();
      jumpToTop("auto");
      return;
    }

    // Decoration only: browsers without the API just swap, as before.
    if (typeof document.startViewTransition !== "function") {
      commit();
      jumpToTop("smooth");
      return;
    }

    document.startViewTransition(() => {
      // startViewTransition snapshots the DOM once this callback returns, and
      // React would still have the update queued by then, so it has to be
      // flushed here or the transition captures the old screen twice.
      flushSync(commit);
      jumpToTop("auto");
    });
  };

  const handleSettingsOpen = () => {
    navigateToPath("/settings");
  };

  const handleMessagesOpen = () => {
    navigateToPath("/messages");
  };

  const handleCorkboardOpen = () => {
    navigateToPath("/corkboard");
  };

  const handleMyClassesOpen = () => {
    navigateToPath("/my-classes");
  };

  const handleMyPageOpen = () => {
    navigateToPath("/me");
  };

  const handleMainOpen = () => {
    navigateToPath("/");
    if (authState?.authenticated) {
      refreshAuthState().catch(() => null);
      loadAppliedScheduleItemIds().catch(() => null);
      loadMemberMessageUnreadCount().catch(() => null);
      loadLessonNoticeUnreadCount().catch(() => null);
    }
  };

  const handlePrivacyOpen = (event) => {
    event.preventDefault();
    navigateToPath("/privacy");
  };

  const handleMemberSubpageBack = () => {
    const fallbackPath = authState?.authenticated ? "/me" : "/";
    if (previousPathRef.current === "/me" && typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigateToPath(fallbackPath);
  };

  const handleLogout = () => {
    setIsAuthActionPending(true);
    authApi
      .logout()
      .catch(() => null)
      .finally(() => {
        clearPersistedLanguagePreferences();
        // Cleared alongside the state, or a reload would resurrect it from
        // storage and disagree with what is on screen.
        clearStoredGuestLanguage();
        setAuthState({ authenticated: false });
        setGuestLanguage(null);
        setAppliedScheduleItemIds([]);
        setIsAppliedScheduleLoading(false);
        setMemberMessageUnreadCount(0);
        setLessonNoticeUnreadCount(0);
        setIsAuthActionPending(false);
        if (
          currentPath === "/settings" ||
          currentPath === "/messages" ||
          currentPath === "/my-classes" ||
          currentPath === "/me" ||
          currentPath === "/oauth/success"
        ) {
          navigateToPath("/");
        }
      });
  };

  const handleSettingsSaved = (settings) => {
    refreshAuthState().catch(() => {
      setAuthState((currentAuthState) => ({
        ...currentAuthState,
        authenticated: true,
        memberId: settings?.memberId ?? currentAuthState.memberId,
        email: settings?.email ?? currentAuthState.email,
        displayName: settings?.displayName ?? currentAuthState.displayName,
        nickname: settings?.nickname ?? null,
        preferredLanguage: settings?.preferredLanguage ?? currentAuthState.preferredLanguage,
        role: settings?.role ?? currentAuthState.role,
      }));
    });
  };

  // First-time Google sign-up: save the chosen preferred language to My Settings and
  // tell the member they can change it later.
  const handleLanguageOnboardingSelect = async (nextLanguage) => {
    const preferred = nextLanguage === "en" ? "EN" : "KO";
    try {
      const saved = await authApi.updateSettings({ preferredLanguage: preferred });
      handleSettingsSaved(saved);
    } catch {
      setAuthState((currentAuthState) => ({ ...currentAuthState, preferredLanguage: preferred }));
    } finally {
      setPendingLanguageOnboarding(false);
      setAccountNotice(languageOnboardingMessage(nextLanguage));
    }
  };

  const handleWithdrawComplete = (message) => {
    clearPersistedLanguagePreferences();
    clearStoredGuestLanguage();
    setAuthState({ authenticated: false });
    setGuestLanguage(null);
    setAppliedScheduleItemIds([]);
    setIsAppliedScheduleLoading(false);
    setMemberMessageUnreadCount(0);
    setLessonNoticeUnreadCount(0);
    setAccountNotice(message);
    navigateToPath("/");
  };

  const handleApplicationSubmitted = useCallback((savedApplication) => {
    if (!authState?.authenticated) {
      return;
    }

    markScheduleItemApplied(scheduleItemIdFromApplication(savedApplication));
    loadAppliedScheduleItemIds().catch(() => null);
  }, [authState?.authenticated, loadAppliedScheduleItemIds, markScheduleItemApplied]);

  const handleApplicationAlreadyApplied = useCallback((item) => {
    if (!authState?.authenticated) {
      return;
    }

    markScheduleItemApplied(item?.id);
    loadAppliedScheduleItemIds().catch(() => null);
  }, [authState?.authenticated, loadAppliedScheduleItemIds, markScheduleItemApplied]);

  const isAuthenticated = Boolean(authState?.authenticated);

  // The sticky bottom CTA duplicates the hero's "apply" button, so it only earns
  // its space once the hero one has scrolled away. Watching the hero button
  // itself — rather than a scroll offset — keeps the handover correct when the
  // hero reflows (language switch, long titles, small screens).
  const heroCtaRef = useRef(null);
  const [isHeroCtaOnScreen, setIsHeroCtaOnScreen] = useState(true);

  useEffect(() => {
    const node = heroCtaRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroCtaOnScreen(entry.isIntersecting),
      // The sticky header covers the top 63px; a button hidden behind it is not
      // reachable, so treat that band as off-screen.
      { rootMargin: "-63px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const memberLanguage = isAuthenticated ? toAppLanguage(authState.preferredLanguage) : null;
  const effectiveLanguage = isAuthenticated ? memberLanguage : guestLanguage;
  const isPrivacyPath = currentPath === "/privacy";
  const isLoginConsentPath = currentPath === "/login";
  const t = useMemo(() => CONTENT[effectiveLanguage] ?? CONTENT.ko, [effectiveLanguage]);
  const activeLanguage = effectiveLanguage === "en" ? "en" : "ko";

  // Published for screen readers and for the exit guard, which sits outside this
  // component and so has no other way to know which language is being read.
  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  // Installing is offered to signed-in members only — the app is theirs to keep
  // on a home screen, and a visitor who has not signed in has nothing in it yet.
  const { canInstall, installed: isAppInstalled, showIosGuide } = useInstallState();
  const [isInstallAskOpen, setIsInstallAskOpen] = useState(false);

  const handleInstall = useCallback(async () => {
    setIsInstallAskOpen(false);
    rememberInstallAsked();
    await promptInstall();
  }, []);

  const handleInstallAskDismissed = useCallback(() => {
    setIsInstallAskOpen(false);
    // Asked once and answered: the card on My Page is where it lives from here.
    rememberInstallAsked();
  }, []);

  useEffect(() => {
    // iOS gets the same one-off ask, carrying the share-sheet steps: it cannot
    // be offered a prompt, but it can be told the app is installable at all.
    if (!isAuthenticated || (!canInstall && !showIosGuide) || hasBeenAskedToInstall()) {
      return;
    }
    setIsInstallAskOpen(true);
  }, [isAuthenticated, canInstall, showIosGuide]);

  const isSettingsPath = currentPath === "/settings";
  const isMessagesPath = currentPath === "/messages";
  const isCorkboardPath = currentPath === "/corkboard";
  const isMyClassesPath = currentPath === "/my-classes";
  const isMyPagePath = currentPath === "/me";
  // Styling scope only: the SwingPop theme applies to the public landing page.
  // Corkboard and member subpages keep their own existing look.
  const isMainPublicPage =
    !isSettingsPath &&
    !isMessagesPath &&
    !isCorkboardPath &&
    !isMyClassesPath &&
    !isMyPagePath &&
    !isPrivacyPath &&
    !isLoginConsentPath;
  // The login consent screen is public too, so it carries the same background.
  const isSwingThemedPage = isMainPublicPage || isLoginConsentPath;
  const appliedScheduleItemIdSet = useMemo(() => new Set(appliedScheduleItemIds), [appliedScheduleItemIds]);
  const applicationItems = useMemo(
    () =>
      scheduleItems.map((item) => {
        const applicationItem = toApplicationItem(item, activeLanguage, t.application);
        return {
          ...applicationItem,
          isApplied: isAuthenticated && appliedScheduleItemIdSet.has(applicationItem.id),
          isApplyStatusLoading: isAuthenticated && isAppliedScheduleLoading,
        };
      }),
    [activeLanguage, appliedScheduleItemIdSet, isAppliedScheduleLoading, isAuthenticated, scheduleItems, t.application]
  );
  const applicationEventGroups = useMemo(
    () => groupApplicationItemsByEvent(applicationItems),
    [applicationItems]
  );

  return (
    <>
      {/* The first-visit modal is gone; the header picker covers it. The one
          below is a different thing: a new member choosing the language stored
          on their account, asked once right after sign-up. */}
      {pendingLanguageOnboarding && isAuthenticated ? (
        <LanguageSelectionModal
          title={t.languageTitle}
          description={t.languageDesc}
          onSelect={handleLanguageOnboardingSelect}
        />
      ) : null}

      <div
        className={
          isSwingThemedPage
            ? "swing-theme swing-paper min-h-screen bg-swing-paper text-swing-ink"
            : "min-h-screen bg-swing-cream text-swing-ink"
        }
      >
        {!isLoginConsentPath ? (
          <AuthControl
            authState={authState}
            isLoading={isAuthLoading}
            isPending={isAuthActionPending}
            language={activeLanguage}
            onLogin={handleLogin}
            onMyPage={handleMyPageOpen}
            tone={isMainPublicPage ? "swing" : "default"}
          />
        ) : null}
        {accountNotice ? (
          <div className="fixed left-1/2 top-16 z-[130] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-swing-sage bg-swing-paper/95 px-4 py-3 text-center text-sm font-semibold text-swing-teal-deep shadow-lg backdrop-blur">
            {accountNotice}
          </div>
        ) : null}
        {inAppLoginUrl ? (
          <InAppBrowserNotice
            language={activeLanguage}
            url={inAppLoginUrl}
            onClose={() => setInAppLoginUrl("")}
          />
        ) : null}
        {isCorkboardPath ? (
          <CorkboardPage
            authState={authState}
            isLoading={isAuthLoading}
            language={activeLanguage}
            onLogin={handleLogin}
            onBack={handleMainOpen}
          />
        ) : isSettingsPath ? (
          <MemberSettingsPage
            authState={authState}
            isLoading={isAuthLoading}
            language={activeLanguage}
            onLogin={handleLogin}
            onBack={handleMemberSubpageBack}
            onSaved={handleSettingsSaved}
            onWithdraw={handleWithdrawComplete}
            onPrivacy={handlePrivacyOpen}
          />
        ) : isMyPagePath ? (
          <MyPage
            authState={authState}
            isLoading={isAuthLoading}
            isPending={isAuthActionPending}
            language={activeLanguage}
            onLogin={handleLogin}
            onBack={handleMainOpen}
            onMyClasses={handleMyClassesOpen}
            onMessages={handleMessagesOpen}
            onSettings={handleSettingsOpen}
            onLogout={handleLogout}
            onPrivacy={handlePrivacyOpen}
            canInstall={canInstall}
            isInstalled={isAppInstalled}
            showIosGuide={showIosGuide}
            onInstall={handleInstall}
            messageUnreadCount={memberMessageUnreadCount}
            classNoticeUnreadCount={lessonNoticeUnreadCount}
          />
        ) : isMyClassesPath ? (
          <MyClassesPage
            authState={authState}
            isLoading={isAuthLoading}
            language={activeLanguage}
            onLogin={handleLogin}
            onBack={handleMemberSubpageBack}
            onUnreadChanged={loadLessonNoticeUnreadCount}
          />
        ) : isMessagesPath ? (
          <MemberMessagesPage
            authState={authState}
            isLoading={isAuthLoading}
            language={activeLanguage}
            onLogin={handleLogin}
            onBack={handleMemberSubpageBack}
            onUnreadChanged={loadMemberMessageUnreadCount}
          />
        ) : isLoginConsentPath ? (
          <LoginConsentPage
            language={activeLanguage}
            onBack={handleMainOpen}
            onContinue={handleGoogleLogin}
            onPrivacy={handlePrivacyOpen}
          />
        ) : isPrivacyPath ? (
          <PrivacyPolicyPage language={activeLanguage} onBack={handleMainOpen} />
        ) : (
        <>
        <SiteHeader
          nav={t.nav}
          corkboardLabel={t.heroCorkboard}
          onCorkboard={handleCorkboardOpen}
          language={activeLanguage}
          onLanguageChange={handleLanguageSelect}
        />
        <main>
          <SectionWrapper
            id="top"
            className="border-b border-swing-border/25 bg-gradient-to-b from-swing-peach/75 via-swing-cream/55 to-swing-paper"
            contentClassName="pt-14 pb-16 md:pt-20 md:pb-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="swing-rule text-swing-teal/70" aria-hidden="true">
                <span className="text-base leading-none">✦</span>
              </div>
              <h1 className="mt-7 font-display text-[2.1rem] font-bold leading-[1.28] text-swing-ink md:text-6xl md:leading-[1.2]">
                {t.heroTitle}
              </h1>
              <p className="mx-auto mt-7 max-w-2xl whitespace-pre-line text-[0.95rem] leading-8 text-swing-muted md:text-base">
                {t.heroDesc}
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <a
                  ref={heroCtaRef}
                  href="#schedule"
                  onClick={() => setActiveFilter("all")}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-swing-teal-deep px-7 text-sm font-medium tracking-wide text-swing-paper shadow-frame transition hover:-translate-y-0.5 hover:bg-swing-teal focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-cream"
                >
                  {t.heroPrimary}
                </a>
                <a
                  href="#about"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-swing-border/40 bg-swing-paper/90 px-7 text-sm font-medium tracking-wide text-swing-ink shadow-frame transition hover:-translate-y-0.5 hover:bg-swing-cream focus:outline-none focus:ring-2 focus:ring-swing-teal focus:ring-offset-2 focus:ring-offset-swing-cream"
                >
                  {t.heroSecondary}
                </a>
                <button
                  type="button"
                  onClick={handleCorkboardOpen}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-swing-gold/50 bg-swing-gold/25 px-7 text-sm font-medium tracking-wide text-swing-burgundy shadow-frame transition hover:-translate-y-0.5 hover:bg-swing-gold/40 focus:outline-none focus:ring-2 focus:ring-swing-gold focus:ring-offset-2 focus:ring-offset-swing-cream"
                >
                  {t.heroCorkboard}
                </button>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="about" contentClassName="py-20 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16">
              <div>
                <p className="font-display text-sm tracking-[0.2em] text-swing-teal">
                  {t.sections[0].eyebrow}
                </p>
                <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-snug text-swing-ink md:text-[2.6rem]">
                  {t.sections[0].title}
                </h2>
                <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-swing-muted">
                  {t.sections[0].body.map((paragraph) => (
                    <p key={`${activeLanguage}-about-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {t.sections[0].stats.map((stat, index) => (
                  <div
                    key={`${activeLanguage}-${stat.label}`}
                    className={`swing-frame rounded-sm px-1.5 py-4 text-center sm:px-4 sm:py-7 ${
                      [
                        "bg-swing-mint/70",
                        "bg-swing-peach/45",
                        "bg-swing-cream/80",
                      ][index % 3]
                    }`}
                  >
                    <div className="font-display text-sm font-bold leading-tight text-swing-ink sm:text-lg md:text-xl">
                      {stat.label}
                    </div>
                    <div className="mt-1.5 break-words text-[0.55rem] uppercase leading-tight tracking-normal text-swing-muted sm:mt-2 sm:text-[0.7rem] sm:tracking-[0.1em]">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper
            id="swing"
            className="border-y border-swing-border/25 bg-swing-sage/60"
            contentClassName="py-20 md:py-24"
          >
            <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
              <div>
                <p className="font-display text-sm tracking-[0.2em] text-swing-teal-deep">
                  {t.sections[1].eyebrow}
                </p>
                <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-snug text-swing-ink md:text-[2.6rem]">
                  {t.sections[1].title}
                </h2>
                <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-swing-ink/75">
                  {t.sections[1].body.map((paragraph) => (
                    <p key={`${activeLanguage}-swing-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl bg-swing-paper p-2.5 shadow-xl shadow-swing-ink/20 ring-1 ring-swing-border/20 sm:p-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-swing-cream">
                  <Slideshow
                    images={swingIntroPhotos}
                    intervalMs={6000}
                    focus={{ "05.jpg": "30% 50%" }}
                    alt={activeLanguage === "en"
                      ? "Vintage swing and Lindy Hop dancers through the decades"
                      : "시대를 대표하는 빈티지 스윙·린디합 댄서들"}
                  />
                </div>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-2.5 sm:gap-4">
              {t.sections[1].points.map((point) => (
                <span
                  key={`${activeLanguage}-${point}`}
                  className="swing-frame flex items-center justify-center rounded-sm bg-swing-paper/85 px-2 py-3 text-center text-xs leading-tight text-swing-ink sm:px-5 sm:py-5 sm:text-sm sm:leading-6"
                >
                  {point}
                </span>
              ))}
            </div>
          </SectionWrapper>

          <SectionWrapper id="swingpop-style" contentClassName="py-20 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-16">
              <div className="lg:order-2">
                <p className="font-display text-sm tracking-[0.2em] text-swing-teal">
                  {t.sections[2].eyebrow}
                </p>
                <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-snug text-swing-ink md:text-[2.6rem]">
                  {t.sections[2].title}
                </h2>
                <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-swing-muted">
                  {t.sections[2].body.map((paragraph) => (
                    <p key={`${activeLanguage}-style-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl bg-swing-paper p-2.5 shadow-xl shadow-swing-ink/20 ring-1 ring-swing-border/20 sm:p-3 lg:order-1">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-swing-cream">
                  <Slideshow
                    images={swingpopStylePhotos}
                    intervalMs={6000}
                    alt={activeLanguage === "en"
                      ? "SwingPop members dancing and sharing warm community moments"
                      : "스윙팝 멤버들이 함께 춤추고 어울리는 따뜻한 순간들"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
              {t.sections[2].cards.map((card, index) => (
                <div
                  key={`${activeLanguage}-${card.title}`}
                  className="swing-frame flex flex-col rounded-sm bg-swing-paper/90 p-3 sm:p-5 md:p-7"
                >
                  <div
                    className={`mx-auto h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full border border-swing-border/40 ${
                      ["bg-swing-mint", "bg-swing-peach/70", "bg-swing-gold/50"][index % 3]
                    }`}
                    aria-hidden="true"
                  />
                  <div className="mt-3 sm:mt-4 md:mt-5 text-center font-display text-sm leading-tight sm:text-lg sm:leading-snug md:text-xl font-bold text-swing-ink">
                    {card.title}
                  </div>
                  <p className="mt-2 md:mt-3 text-center text-xs leading-5 sm:text-sm sm:leading-7 text-swing-muted">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </SectionWrapper>

          <SectionWrapper
            id="seoul-scene"
            className="border-y border-swing-border/25 bg-swing-coral/70"
            contentClassName="py-20 md:py-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm tracking-[0.2em] text-swing-paper">
                {t.sections[3].eyebrow}
              </p>
              <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-snug text-swing-paper md:text-[2.6rem]">
                {t.sections[3].title}
              </h2>
              <div className="mt-6 space-y-4 text-[0.95rem] leading-8 text-swing-paper/85">
                {t.sections[3].body.map((paragraph) => (
                  <p key={`${activeLanguage}-scene-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
              <div className="swing-frame mx-auto mt-10 max-w-2xl rounded-sm bg-swing-paper/92 px-7 py-6 text-[0.95rem] leading-8 text-swing-ink">
                {t.sections[3].highlight}
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="schedule" className="bg-swing-cream/45" contentClassName="py-20 md:py-24">
            <ScheduleAndApplicationSection
              language={activeLanguage}
              scheduleSection={t.sections[4]}
              labels={t.application}
              items={applicationEventGroups}
              isLoading={isScheduleLoading}
              error={scheduleError}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onSelectEvent={setSelectedEvent}
            />
          </SectionWrapper>

          <SectionWrapper id="visitor-guide" className="border-t border-swing-border/25 bg-swing-sky/35" contentClassName="py-20">
            <VisitorGuideSection language={activeLanguage} labels={t.visitorGuide} info={visitorGuideInfo} />
          </SectionWrapper>
        </main>
        </>
        )}

        {!isSettingsPath && !isMessagesPath && !isCorkboardPath && !isMyClassesPath && !isMyPagePath && !isPrivacyPath && !isLoginConsentPath ? (
        <footer className="bg-swing-teal-deep">
          <div className="mx-auto max-w-6xl px-6 py-9 text-center text-sm leading-7 text-swing-paper/75 md:px-8">
            <div className="swing-rule mb-5 text-swing-paper/35" aria-hidden="true">
              <span className="text-sm leading-none">✦</span>
            </div>
            {t.footer}
          </div>
        </footer>
        ) : null}

        {!isSettingsPath && !isMessagesPath && !isCorkboardPath && !isMyClassesPath && !isMyPagePath && !isPrivacyPath && !isLoginConsentPath ? (
          <>
            {/* Signed-in members reach their schedule from My Page, so the bar
                never shows for them — and without the bar there is nothing to
                clear, hence no spacer either. */}
            {!isAuthenticated ? (
              <>
                <div className="h-28 md:hidden" aria-hidden="true" />
                <MobileStickyCta
                  label={t.mobileApply}
                  onClick={() => scrollToHash("#schedule")}
                  isVisible={!isHeroCtaOnScreen}
                />
              </>
            ) : null}
          </>
        ) : null}
        <EventLessonsModal
          group={selectedEvent}
          labels={t.application}
          onClose={() => setSelectedEvent(null)}
          onSelectLesson={(lesson) => {
            // The class list stays open underneath: the apply modal covers it,
            // and going back from there returns here rather than to the page.
            setSelectedApplication(lesson);
          }}
        />
        {isInstallAskOpen ? (
          <InstallAskModal
            labels={MY_PAGE_COPY[activeLanguage] ?? MY_PAGE_COPY.ko}
            onInstall={handleInstall}
            onDismiss={handleInstallAskDismissed}
          />
        ) : null}
        <ApplicationModal
          item={selectedApplication}
          language={activeLanguage}
          labels={t.applicationModal}
          detailLabels={t.application}
          authState={authState}
          onClose={() => setSelectedApplication(null)}
          onSubmitted={handleApplicationSubmitted}
          onAlreadyApplied={handleApplicationAlreadyApplied}
        />
      </div>
    </>
  );
}

export default function App() {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  // On the admin host the whole origin is the admin app, so it answers at the
  // root as well — that is what its installed copy opens.
  if (isAdminPath || isAdminHost()) {
    return <AdminApp />;
  }

  return <PublicApp />;
}
