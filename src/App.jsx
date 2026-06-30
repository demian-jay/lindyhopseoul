import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AdminApp from "./AdminApp";
import CorkboardPage from "./CorkboardPage";
import { authApi } from "./api/auth";
import { memoApi } from "./api/memos";
import { publicScheduleApi } from "./api/publicSchedules";

const CONTENT = {
  ko: {
    nav: ["스윙팝", "스윙댄스", "스윙팝의 춤", "서울 씬", "일정 및 신청"],
    heroBadge: "SwingPop Community",
    heroTitle: "서울에서 만나는 따뜻한 스윙댄스 커뮤니티",
    heroDesc:
      "스윙팝은 한국인과 외국인이 함께 어울리며 춤과 음악, 사람 사이의 연결을 즐기는 스윙댄스 커뮤니티입니다. 처음 온 사람도 편안하게 분위기를 느끼고, 서울의 스윙 문화를 자연스럽게 만나볼 수 있도록 구성했습니다.",
    heroPrimary: "일정 보고 신청하기",
    heroSecondary: "커뮤니티 소개 보기",
    mobileApply: "일정 보고 신청하기",
    languageTitle: "언어를 선택해주세요",
    languageDesc: "Choose your preferred language to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
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
        { id: "social", label: "Dialogue Party" },
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
      levelNotice: "Level 2 이상 수업은 권장 경험 기준이 있습니다. 신청 시 수강 기준을 확인해주세요.",
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
          "스윙댄스는 재즈 음악과 함께 발전해온 소셜댄스로, 파트너와 호흡을 맞추며 자유롭게 리듬을 즐기는 춤입니다.",
          "정답을 외워서 추기보다 음악을 듣고 서로 반응하며 움직이는 재미가 크기 때문에, 처음 접하는 사람도 생각보다 빠르게 즐거움을 느낄 수 있습니다.",
        ],
        points: ["재즈와 함께하는 리듬감", "사람과 연결되는 소셜댄스", "초보자도 시작 가능한 구조"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. 스윙팝의 스윙댄스",
        title: "스윙팝에서는 어떻게 배우고 즐기나요?",
        body: [
          "스윙팝에서는 수업을 통해 기본기를 배우고, 소셜댄스 시간에는 다양한 사람들과 자유롭게 춤추며 익힌 내용을 자연스럽게 경험합니다.",
          "단순히 기술만 배우는 것이 아니라, 함께 인사하고 어울리고 음악을 즐기는 과정 전체를 커뮤니티 경험으로 중요하게 생각합니다.",
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
          "처음이라면 Level 1을 먼저 추천합니다. 기존 회원은 필터로 정규수업, 워크샵, Dialogue Party, 특별 이벤트를 빠르게 좁혀볼 수 있습니다.",
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
    heroTitle: "A warm swing dance community in Seoul",
    heroDesc:
      "SwingPop is a swing dance community where Koreans and internationals connect through dance, music, and shared experiences. This page is designed to help first-time visitors quickly understand who we are and why Seoul’s swing dance culture is worth exploring.",
    heroPrimary: "View & Apply",
    heroSecondary: "About the Community",
    mobileApply: "View & Apply",
    languageTitle: "Choose your language",
    languageDesc: "Select Korean or English to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
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
        { id: "social", label: "Dialogue Party" },
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
      levelNotice: "Level 2+ classes have recommended experience guidelines. Please check the class requirements when applying.",
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
          "Swing dance is a social dance that grew with jazz music. It is about sharing rhythm with a partner and enjoying music in a lively, expressive way.",
          "Rather than memorizing fixed answers, you listen, respond, and move with another person. That is why even beginners can quickly discover its fun and charm.",
        ],
        points: ["Rhythm rooted in jazz", "A social dance built on connection", "Accessible for beginners"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. Swing Dance at SwingPop",
        title: "How do people learn and enjoy dance at SwingPop?",
        body: [
          "At SwingPop, people learn the basics in class and then experience the real joy of swing dance during social dancing with many different partners.",
          "We care not only about technique, but also about greeting people, enjoying music, and building real connection through the full community experience.",
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
          "If you are new, Level 1 is the recommended starting point. Returning members can use filters for regular classes, workshops, Dialogue Party, and special events.",
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

const SECTION_IDS = ["about", "swing", "swingpop-style", "seoul-scene", "schedule"];
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
const MEMBER_LANGUAGE_TO_APP_LANGUAGE = {
  KO: "ko",
  EN: "en",
};
const APP_LANGUAGE_TO_MEMBER_LANGUAGE = {
  ko: "KO",
  en: "EN",
};

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
      className={`flex w-full items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 text-sm text-blue-900/60 ${height}`}
    >
      {label}
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/45 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      aria-describedby="language-modal-description"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-blue-100 bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
          Language Selection
        </div>
        <h2 id="language-modal-title" className="text-2xl font-semibold tracking-tight text-blue-950">
          {title}
        </h2>
        <p id="language-modal-description" className="mt-3 text-sm leading-6 text-blue-950/70">
          {description}
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => onSelect("ko")}
            className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="한국어 선택"
          >
            <div>
              <div className="text-base font-semibold text-blue-950">한국어</div>
              <div className="mt-1 text-sm text-blue-950/65">한국어로 페이지 보기</div>
            </div>
            <span className="text-blue-700">→</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("en")}
            className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Choose English"
          >
            <div>
              <div className="text-base font-semibold text-blue-950">English</div>
              <div className="mt-1 text-sm text-blue-950/65">View the page in English</div>
            </div>
            <span className="text-blue-700">→</span>
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

function MobileStickyCta({ label, onClick }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-blue-900/10 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
}

function VisitorGuidePanel({ panel, isOpen, onToggle, children }) {
  const contentId = `visitor-guide-${panel.id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-blue-200 bg-white/90 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[76px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-blue-50/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:px-6"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span>
          <span className="block text-base font-semibold text-blue-950 sm:text-lg">{panel.title}</span>
          <span className="mt-1 block text-sm leading-6 text-blue-950/60">{panel.summary}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-lg font-semibold text-blue-800">
          {isOpen ? "-" : "+"}
        </span>
      </button>
      {isOpen ? (
        <div id={contentId} className="border-t border-blue-100 px-5 py-5 sm:px-6">
          {children}
        </div>
      ) : null}
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
          <article key={item.id} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-semibold text-blue-800">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-blue-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-blue-950/70">{item.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      {backEntranceLocation ? (
        <button
          type="button"
          onClick={handleShowBackEntranceGuide}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          {labels.firstVisit.backEntranceButton}
        </button>
      ) : null}
    </div>
  );

  const renderAnnouncementPanel = () => (
    <div>
      <p className="text-sm leading-7 text-blue-950/70">{labels.announcement.intro}</p>
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
      <p className="text-sm leading-7 text-blue-950/70">{labels.contact.intro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="text-sm font-semibold text-blue-950">{labels.contact.kakaoTalk}</div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-blue-950/75">
            {kakaoContacts.map((contact) => (
              <div key={`${contact.type}-${contact.value}`} className="flex flex-wrap gap-x-2 gap-y-1">
                <span className="font-semibold text-blue-950">{getLocalizedLinkLabel(contact, language)}:</span>
                <span>{contact.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4">
          <div className="text-sm font-semibold text-blue-950">{labels.contact.instagram}</div>
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
      <p className="text-sm leading-7 text-blue-950/70">{labels.location.intro}</p>
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
              className="scroll-mt-28 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-blue-950">{locationName}</h3>
                  <p className="mt-2 text-sm leading-7 text-blue-950/65">{description}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <VisitorGuideLink href={location.googleMapUrl}>{labels.location.googleMaps}</VisitorGuideLink>
                  <VisitorGuideLink href={location.naverMapUrl}>{labels.location.naverMap}</VisitorGuideLink>
                </div>

                {notice ? (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-7 text-teal-950">
                    {notice}
                  </div>
                ) : null}

                {hasImages ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleImageLocation(location.name)}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
                      aria-expanded={areImagesOpen}
                    >
                      {areImagesOpen ? labels.location.backEntranceCloseButton : labels.location.backEntranceButton}
                    </button>

                    {areImagesOpen ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {sortedImages.map((image) => (
                          <figure key={image.sortOrder} className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/70">
                            {image.imageUrl ? (
                              <img
                                src={image.imageUrl}
                                alt={language === "en" ? image.altTextEn : image.altTextKo}
                                className="aspect-[4/3] w-full object-cover"
                              />
                            ) : (
                              <div className="flex aspect-[4/3] w-full items-center justify-center px-4 text-center text-sm font-medium leading-6 text-blue-900/55">
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
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">{labels.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-4xl">{labels.title}</h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-blue-950/70">{labels.description}</p>
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
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
          {labels.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
          {labels.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-8 text-blue-950/70">
          {labels.description}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-950">
            {isEditing ? labels.editFormTitle : labels.formTitle}
          </h3>

          <label className="mt-5 block text-sm font-medium text-blue-950/75" htmlFor="memo-title">
            {labels.titleLabel}
          </label>
          <input
            id="memo-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleFormChange}
            placeholder={labels.titlePlaceholder}
            className="mt-2 min-h-[48px] w-full rounded-2xl border border-blue-200 px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="mt-4 block text-sm font-medium text-blue-950/75" htmlFor="memo-content">
            {labels.contentLabel}
          </label>
          <textarea
            id="memo-content"
            name="content"
            value={form.content}
            onChange={handleFormChange}
            placeholder={labels.contentPlaceholder}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-blue-200 px-4 py-3 text-sm leading-6 text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isEditing ? labels.updateButton : labels.createButton}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50"
              >
                {labels.cancelButton}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-blue-950">{labels.listTitle}</h3>
          {isLoading ? <span className="text-sm text-blue-950/50">{labels.loading}</span> : null}
        </div>

        <div className="mt-4 space-y-3" aria-live="polite">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {!isLoading && memos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-6">
              <div className="text-base font-semibold text-blue-950">{labels.emptyTitle}</div>
              <p className="mt-2 text-sm leading-6 text-blue-950/65">{labels.emptyDescription}</p>
            </div>
          ) : null}

          {memos.map((memo) => (
            <article key={memo.id} className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-blue-950">{memo.title}</h4>
                  <p className="mt-1 text-xs text-blue-950/45">{formatMemoDate(memo.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(memo)}
                    className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-950 transition hover:bg-blue-50"
                  >
                    {labels.editButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(memo.id)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    {labels.deleteButton}
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-blue-950/70">{memo.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-900/45">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-blue-950/75">{value}</dd>
    </div>
  );
}

function PriceValue({ price, note }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span>{price}</span>
      {note ? <span className="text-xs leading-5 text-blue-950/45">{note}</span> : null}
    </span>
  );
}

const EVENT_TYPE_LABELS = {
  ko: {
    REGULAR_CLASS: "정규수업",
    PARTY: "특별 이벤트",
    DIALOGUE_PARTY: "Dialogue Party",
  },
  en: {
    REGULAR_CLASS: "Regular Class",
    PARTY: "Special Event",
    DIALOGUE_PARTY: "Dialogue Party",
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
    title: translation.title || translation.eventTitle || eventTypeLabel,
    date: formatDateRange(item.startDate, item.endDate, language),
    time: formatTimeRange(item.startTime, item.endTime) || labels.toBeAnnounced,
    location: item.location || labels.toBeAnnounced,
    addressInfoEnabled: Boolean(item.addressInfoEnabled),
    googleMapUrl: item.googleMapUrl || "",
    naverMapUrl: item.naverMapUrl || "",
    price: formatPrice(item.fee, item.currency, labels, language),
    paymentNote: item.fee !== null && item.fee !== undefined && Number(item.fee) > 0 ? labels.paymentNote : "",
    teacher: formatTeachers(item.teachers, labels),
    description: translation.description || translation.shortDescription || "",
    roleSelectionEnabled: Boolean(item.roleSelectionEnabled),
  };
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
      className={`grid gap-5 rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        item.isRecommended ? "border-amber-300 ring-2 ring-amber-100" : "border-blue-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
              {item.eventType}
            </span>
            {item.isRecommended ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {labels.recommended}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-blue-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-blue-950/70">{item.description}</p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label={labels.details.date} value={item.date} />
        <DetailRow label={labels.details.time} value={item.time} />
        <DetailRow label={labels.details.location} value={item.location} />
        <DetailRow label={labels.details.price} value={<PriceValue price={item.price} note={item.paymentNote} />} />
        <DetailRow label={labels.details.teacher} value={item.teacher} />
      </dl>

      {item.requiresLevelNotice ? (
        <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
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
        className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isApplied
            ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-800"
            : item.isApplyStatusLoading
              ? "cursor-wait border border-blue-100 bg-blue-50 text-blue-950/45"
              : "bg-blue-700 text-white hover:bg-blue-800"
        }`}
      >
        {isApplied ? labels.appliedButton : labels.applyButton}
      </button>
    </article>
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
  onApply,
}) {
  const filteredItems =
    activeFilter === "all" ? items : items.filter((item) => item.filterIds.includes(activeFilter));
  const hasItems = items.length > 0;

  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">{scheduleSection.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">{scheduleSection.title}</h2>
        <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
          {scheduleSection.body.map((paragraph) => (
            <p key={`${language}-schedule-${paragraph}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="scroll-mt-24">
        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold text-blue-950">{labels.filtersTitle}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {labels.filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeFilter === filter.id
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-blue-200 bg-white text-blue-950 hover:bg-blue-50"
                }`}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-blue-200 bg-white px-5 py-8 text-center text-sm text-blue-950/65">
            {labels.loading}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm leading-6 text-red-700">
            {labels.loadError}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <ApplicationCard key={item.id} item={item} language={language} labels={labels} onApply={onApply} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-blue-200 bg-white px-5 py-8 text-center text-sm text-blue-950/65">
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
      className="fixed inset-0 z-[110] flex items-end justify-center bg-blue-950/55 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-modal-title"
    >
      <div className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-900/45">
              {item.eventType}
            </p>
            <h2 id="application-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-blue-950">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-sm font-semibold text-blue-950 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={labels.close}
          >
            X
          </button>
        </div>

        <dl className="mt-6 grid gap-4 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 sm:grid-cols-2">
          <DetailRow label={detailLabels.details.date} value={item.date} />
          <DetailRow label={detailLabels.details.time} value={item.time} />
          <DetailRow label={detailLabels.details.location} value={item.location} />
          <DetailRow label={detailLabels.details.price} value={<PriceValue price={item.price} note={item.paymentNote} />} />
          <DetailRow label={detailLabels.details.teacher} value={item.teacher} />
        </dl>

        <p className="mt-5 text-sm leading-7 text-blue-950/70">{item.description}</p>

        {item.requiresLevelNotice ? (
          <p className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
            {detailLabels.levelNotice}
          </p>
        ) : null}

        {submittedApplication ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <section>
              <h3 className="text-lg font-semibold text-emerald-950">{labels.successTitle}</h3>
            </section>
            <section className="mt-4 border-t border-emerald-200 pt-4">
              <div className="text-sm font-semibold text-emerald-950">{labels.noticeTitle}</div>
              <p className="mt-2 text-sm leading-6 text-emerald-900/75">{labels.noticeBody}</p>
              <a
                href="https://open.kakao.com/o/gdODdZIe"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                {labels.announcementRoom}
              </a>
            </section>
            <section className="mt-4 border-t border-emerald-200 pt-4">
              <div className="text-sm font-semibold text-emerald-950">{labels.contactTitle}</div>
              <p className="mt-2 text-sm leading-6 text-emerald-900/75">{labels.contactBody}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/55">
                    {labels.kakaoTalk}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-emerald-950">
                    <div>{labels.koreanContact}</div>
                    <div>{labels.englishContact}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900/55">
                    Instagram
                  </div>
                  <a
                    href="https://www.instagram.com/swingpopseoul"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    {labels.instagramDm}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-900/75">{labels.announcementQuestion}</p>
            </section>
            {shouldShowMapLinks ? (
              <section className="mt-4 border-t border-emerald-200 pt-4">
                <div className="text-sm font-semibold text-emerald-950">{labels.mapTitle}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.googleMapUrl ? (
                    <a
                      href={item.googleMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      {labels.googleMaps}
                    </a>
                  ) : null}
                  {item.naverMapUrl ? (
                    <a
                      href={item.naverMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
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
              className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
            >
              {labels.chooseAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-blue-950/75">
                  {labels.nameLabel}
                  <button
                    type="button"
                    onClick={() => setIsNameHelpOpen((current) => !current)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={labels.nameLabel}
                    aria-expanded={isNameHelpOpen}
                  >
                    ?
                  </button>
                </span>
                {isNameHelpOpen ? (
                  <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-950/75">
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
                  className={`mt-2 min-h-[48px] w-full rounded-2xl border px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:ring-2 focus:ring-blue-200 ${
                    isAuthenticated
                      ? "border-blue-100 bg-blue-50/70 text-blue-950/70"
                      : "border-blue-200 bg-white focus:border-blue-500"
                  }`}
                />
                {isAuthenticated ? (
                  <span className="mt-2 block text-xs leading-5 text-blue-950/55">
                    {labels.nameManagedBySettings}
                  </span>
                ) : null}
              </label>
              {item.roleSelectionEnabled ? (
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-blue-950/75">{labels.danceRoleLabel}</span>
                    <select
                      name="danceRole"
                      value={form.danceRole}
                      onChange={handleChange}
                      className="mt-2 min-h-[48px] w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">{labels.danceRolePlaceholder}</option>
                      {Object.entries(labels.danceRoles).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm leading-7 text-blue-950/75">
                    {labels.danceRoleGuide.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-blue-950/75">{labels.requestMemoLabel}</span>
                <textarea
                  name="requestMemo"
                  value={form.requestMemo}
                  onChange={handleChange}
                  rows={4}
                  placeholder={labels.requestMemoPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm leading-6 text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <span className="mt-2 block text-xs leading-5 text-blue-950/55">
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
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {labels.close}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
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
        <section className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-blue-950">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {labels.back}
            </button>
          </div>
          <div className="mt-5 text-right">
            <a
              href="/privacy"
              onClick={onPrivacy}
              className="text-xs font-medium text-blue-950/45 underline decoration-blue-950/20 underline-offset-2 transition hover:text-blue-950/70"
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
      <section className="mx-auto max-w-2xl rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {labels.back}
          </button>
        </div>

        {isSettingsLoading ? (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950/65">
            ...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-blue-950/70">{labels.email}</span>
              <input
                type="text"
                readOnly
                value={settings?.email || authState?.email || ""}
                className="mt-2 min-h-[46px] w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm text-blue-950/70 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-blue-950/70">{labels.displayName}</span>
              <input
                type="text"
                readOnly
                value={settings?.displayName || authState?.displayName || ""}
                className="mt-2 min-h-[46px] w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm text-blue-950/70 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-blue-950/70">{labels.nickname}</span>
              <input
                name="nickname"
                type="text"
                value={form.nickname}
                onChange={handleChange}
                maxLength={20}
                placeholder={labels.nicknamePlaceholder}
                className="mt-2 min-h-[46px] w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-blue-950/70">{labels.preferredLanguage}</span>
              <select
                name="preferredLanguage"
                value={form.preferredLanguage}
                onChange={handleChange}
                className="mt-2 min-h-[46px] w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="KO">{labels.korean}</option>
                <option value="EN">{labels.english}</option>
              </select>
            </label>

            {notice ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
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
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
              >
                {isSaving ? labels.saving : labels.save}
              </button>
            </div>

            <div className="mt-4 border-t border-blue-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setIsWithdrawConfirmOpen(true);
                }}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-700/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200"
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
            className="text-xs font-medium text-blue-950/45 underline decoration-blue-950/20 underline-offset-2 transition hover:text-blue-950/70"
          >
            {labels.privacyLink}
          </a>
        </div>
      </section>

      {isWithdrawConfirmOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-blue-950/45 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-confirm-title"
        >
          <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="withdraw-confirm-title" className="text-xl font-semibold tracking-tight text-blue-950">
              {labels.withdrawConfirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.withdrawConfirmBody}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsWithdrawConfirmOpen(false)}
                disabled={isWithdrawing}
                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:text-blue-950/45"
              >
                {labels.withdrawCancel}
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
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
        <section className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-blue-950">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <section className="mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8">
          {isApplicationsLoading ? (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 px-5 py-8 text-center text-sm text-blue-950/60">
              {labels.loading}
            </div>
          ) : null}

          {!isApplicationsLoading && error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isApplicationsLoading && !error && applications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-8 text-center text-sm text-blue-950/60">
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
                    className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="inline-flex min-h-[28px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800">
                          {labels.status}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold tracking-tight text-blue-950">
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
                      <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                        <div className="text-xs font-semibold text-blue-950/50">{labels.notices}</div>
                        <div className="mt-3 grid gap-3">
                          {notices.map((notice) => (
                            <article key={notice.id} className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                              <div className="text-xs font-semibold text-blue-950/50">
                                {formatLessonNoticeAuthor(notice, labels)} · {formatMessageDate(notice.createdAt, language)}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950/75">
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
        <section className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-blue-950">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <section className="mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">{labels.title}</h1>
            <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
          {isMessagesLoading ? (
            <div className="py-8 text-center text-sm text-blue-950/60">{labels.loading}</div>
          ) : thread.messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-blue-950/60">{labels.empty}</div>
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
                          ? "bg-blue-700 text-white"
                          : "border border-blue-100 bg-white text-blue-950"
                      }`}
                    >
                      <div className={`text-xs font-semibold ${isMember ? "text-white/75" : "text-blue-950/55"}`}>
                        {isMember ? labels.member : formatStaffSenderLabel(message, labels)}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      <div className={`mt-2 text-[11px] ${isMember ? "text-white/65" : "text-blue-950/45"}`}>
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
            className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm leading-6 text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          {notice ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
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
              className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
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
        <section className="mx-auto max-w-xl rounded-3xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-blue-950">{labels.loginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-blue-950/65">{labels.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {labels.login}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <h1 className="text-3xl font-semibold tracking-tight text-blue-950 sm:text-4xl">{labels.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-950/65">{labels.description}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-blue-200 bg-white/85 px-4 text-sm font-semibold text-blue-950 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {labels.back}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-blue-100 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-900/45">
            {labels.accountLabel}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-blue-950">{displayName}</div>
          {email ? (
            <div className="mt-2 text-sm text-blue-950/55">
              <span className="font-semibold">{labels.emailLabel}</span>
              <span className="mx-2 text-blue-950/25">/</span>
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
                className="min-h-[132px] rounded-3xl border border-blue-100 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="flex items-center justify-between gap-3 text-lg font-semibold tracking-tight text-blue-950">
                  <span>{item.title}</span>
                  {unreadCount > 0 ? (
                    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-blue-700 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 block text-sm leading-6 text-blue-950/62">{item.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onLogout}
            disabled={isPending}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-blue-200 bg-white/70 px-4 text-sm font-semibold text-blue-950/70 shadow-sm backdrop-blur transition hover:bg-white hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:text-blue-950/35"
          >
            {isPending ? labels.loggingOut : labels.logout}
          </button>
        </div>

        <div className="mt-5 text-right">
          <a
            href="/privacy"
            onClick={onPrivacy}
            className="text-xs font-medium text-blue-950/45 underline decoration-blue-950/20 underline-offset-2 transition hover:text-blue-950/70"
          >
            {labels.privacyLink}
          </a>
        </div>
      </section>
    </main>
  );
}

function AuthControl({ authState, isLoading, isPending, language, onLogin, onMyPage }) {
  const isAuthenticated = Boolean(authState?.authenticated);
  const labels = MY_PAGE_COPY[language] ?? MY_PAGE_COPY.ko;

  return (
    <div className="fixed right-3 top-3 z-[80] flex max-w-[calc(100vw-24px)] justify-end sm:right-5 sm:top-5">
      <button
        type="button"
        onClick={isAuthenticated ? onMyPage : onLogin}
        disabled={isLoading || isPending}
        className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-white/70 bg-white/80 px-3 text-xs font-semibold text-blue-950 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:text-blue-950/45 sm:min-h-[38px] sm:px-4"
      >
        {isLoading || isPending ? "..." : isAuthenticated ? labels.topButton : labels.login}
      </button>
    </div>
  );
}

function LoginConsentPage({ language, onBack, onContinue, onPrivacy }) {
  const labels = LOGIN_CONSENT_COPY[language] ?? LOGIN_CONSENT_COPY.ko;
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-5 py-24 text-blue-950 md:px-8">
      <section className="w-full rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-900/45">{labels.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{labels.title}</h1>
        <p className="mt-4 text-sm leading-7 text-blue-950/65">{labels.description}</p>

        <div className="mt-6 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm leading-7 text-blue-950/70">
          <p>{labels.summary}</p>
          <p>{labels.noToken}</p>
          <a
            href="/privacy"
            onClick={onPrivacy}
            className="inline-flex text-sm font-semibold text-blue-800 underline decoration-blue-800/30 underline-offset-2 transition hover:text-blue-950"
          >
            {labels.privacyLink}
          </a>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-4 text-sm leading-6 text-blue-950/75 transition hover:border-blue-200 hover:bg-blue-50/50">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(event) => setIsConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-blue-300 text-blue-700 focus:ring-blue-500"
          />
          <span>{labels.checkbox}</span>
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {labels.back}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!isConfirmed}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-24 text-blue-950 md:px-8 md:py-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-blue-200 bg-white/80 px-4 text-sm font-semibold text-blue-950/70 shadow-sm backdrop-blur transition hover:bg-white hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {labels.back}
        </button>
        <div className="inline-flex rounded-full border border-blue-200 bg-white/80 p-1 shadow-sm backdrop-blur">
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
                className={`min-h-[32px] rounded-full px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive ? "bg-blue-700 text-white shadow-sm" : "text-blue-950/60 hover:bg-blue-50 hover:text-blue-950"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <article className="mt-8 rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm backdrop-blur md:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-900/45">{labels.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{labels.title}</h1>
        <p className="mt-5 text-base leading-8 text-blue-950/70">{labels.intro}</p>

        <div className="mt-8 space-y-8">
          {labels.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-blue-950/70">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
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

function PublicApp() {
  const [guestLanguage, setGuestLanguage] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [appliedScheduleItemIds, setAppliedScheduleItemIds] = useState([]);
  const [isAppliedScheduleLoading, setIsAppliedScheduleLoading] = useState(false);
  const [memberMessageUnreadCount, setMemberMessageUnreadCount] = useState(0);
  const [lessonNoticeUnreadCount, setLessonNoticeUnreadCount] = useState(0);
  const [authState, setAuthState] = useState({ authenticated: false });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthActionPending, setIsAuthActionPending] = useState(false);
  const [accountNotice, setAccountNotice] = useState("");
  const [currentPath, setCurrentPath] = useState(
    typeof window === "undefined" ? "/" : window.location.pathname
  );
  const previousPathRef = useRef(null);

  const applyAuthState = useCallback((nextAuthState) => {
    const normalizedAuthState = nextAuthState?.authenticated ? nextAuthState : { authenticated: false };
    setAuthState(normalizedAuthState);
    if (!normalizedAuthState.authenticated) {
      setGuestLanguage(null);
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
    setHasHydrated(true);
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

    authApi
      .me()
      .then((nextAuthState) => {
        if (isMounted) {
          applyAuthState(nextAuthState);
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
      clearPersistedLanguagePreferences();
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
    if (typeof window !== "undefined") {
      window.location.href = authApi.googleLoginUrl();
    }
  };

  const handleLogin = () => {
    navigateToPath("/login");
  };

  const navigateToPath = (path) => {
    if (typeof window === "undefined") {
      return;
    }
    previousPathRef.current = currentPath;
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleWithdrawComplete = (message) => {
    clearPersistedLanguagePreferences();
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
  const memberLanguage = isAuthenticated ? toAppLanguage(authState.preferredLanguage) : null;
  const effectiveLanguage = isAuthenticated ? memberLanguage : guestLanguage;
  const isPrivacyPath = currentPath === "/privacy";
  const isLoginConsentPath = currentPath === "/login";
  const shouldShowLanguageModal =
    !isPrivacyPath &&
    !isLoginConsentPath &&
    hasHydrated &&
    !isAuthLoading &&
    (isAuthenticated ? !memberLanguage : !guestLanguage);
  const t = useMemo(() => CONTENT[effectiveLanguage] ?? CONTENT.ko, [effectiveLanguage]);
  const activeLanguage = effectiveLanguage === "en" ? "en" : "ko";
  const isSettingsPath = currentPath === "/settings";
  const isMessagesPath = currentPath === "/messages";
  const isCorkboardPath = currentPath === "/corkboard";
  const isMyClassesPath = currentPath === "/my-classes";
  const isMyPagePath = currentPath === "/me";
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

  return (
    <>
      {shouldShowLanguageModal ? (
        <LanguageSelectionModal
          title={t.languageTitle}
          description={t.languageDesc}
          onSelect={handleLanguageSelect}
        />
      ) : null}

      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-200/60 to-white text-neutral-900">
        {!isLoginConsentPath ? (
          <AuthControl
            authState={authState}
            isLoading={isAuthLoading}
            isPending={isAuthActionPending}
            language={activeLanguage}
            onLogin={handleLogin}
            onMyPage={handleMyPageOpen}
          />
        ) : null}
        {accountNotice ? (
          <div className="fixed left-1/2 top-16 z-[130] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 text-center text-sm font-semibold text-emerald-800 shadow-lg backdrop-blur">
            {accountNotice}
          </div>
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
        <main aria-hidden={shouldShowLanguageModal ? true : undefined}>
          <SectionWrapper id="top" contentClassName="pt-10 pb-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-blue-950 md:text-6xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-blue-950/70 md:text-lg">
                  {t.heroDesc}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#schedule"
                    onClick={() => setActiveFilter("all")}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:translate-y-[-1px]"
                  >
                    {t.heroPrimary}
                  </a>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-medium text-blue-950 shadow-sm transition hover:translate-y-[-1px] hover:bg-blue-50"
                  >
                    {t.heroSecondary}
                  </a>
                  <button
                    type="button"
                    onClick={handleCorkboardOpen}
                    className="inline-flex items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 px-6 py-3 text-sm font-medium text-teal-900 shadow-sm transition hover:translate-y-[-1px] hover:bg-teal-100"
                  >
                    Agora Corkboard
                  </button>
                </div>
              </div>
              <div>
                <ImagePlaceholder label="Hero Image Placeholder" height="h-[420px]" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="about" contentClassName="pt-8 pb-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <ImagePlaceholder label="Community Image Placeholder" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[0].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[0].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[0].body.map((paragraph) => (
                    <p key={`${activeLanguage}-about-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {t.sections[0].stats.map((stat) => (
                    <div key={`${activeLanguage}-${stat.label}`} className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-900/45">{stat.label}</div>
                      <div className="mt-2 text-lg font-semibold text-blue-950">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="swing" className="bg-white/75">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[1].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[1].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[1].body.map((paragraph) => (
                    <p key={`${activeLanguage}-swing-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {t.sections[1].points.map((point) => (
                    <span
                      key={`${activeLanguage}-${point}`}
                      className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-950/80"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <ImagePlaceholder label="Swing Dance Image Placeholder" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="swingpop-style">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                {t.sections[2].eyebrow}
              </p>
              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                {t.sections[2].title}
              </h2>
              <div className="mx-auto mt-6 max-w-3xl space-y-4 text-base leading-8 text-blue-950/70">
                {t.sections[2].body.map((paragraph) => (
                  <p key={`${activeLanguage}-style-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="grid gap-4 md:grid-cols-3">
                {t.sections[2].cards.map((card) => (
                  <div key={`${activeLanguage}-${card.title}`} className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
                    <div className="text-lg font-semibold text-blue-950">{card.title}</div>
                    <p className="mt-3 text-sm leading-7 text-blue-950/70">{card.desc}</p>
                  </div>
                ))}
              </div>
              <div>
                <ImagePlaceholder label="Class / Social Dance Image Placeholder" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="seoul-scene" className="bg-white/75" contentClassName="pt-20 pb-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <ImagePlaceholder label="Seoul Swing Scene Image Placeholder" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[3].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[3].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[3].body.map((paragraph) => (
                    <p key={`${activeLanguage}-scene-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-6 text-base leading-8 text-blue-950/80 shadow-sm">
                  {t.sections[3].highlight}
                </div>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="schedule" className="bg-white/75" contentClassName="pt-8 pb-20">
            <ScheduleAndApplicationSection
              language={activeLanguage}
              scheduleSection={t.sections[4]}
              labels={t.application}
              items={applicationItems}
              isLoading={isScheduleLoading}
              error={scheduleError}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onApply={setSelectedApplication}
            />
          </SectionWrapper>

          <SectionWrapper id="visitor-guide" className="bg-sky-50/70" contentClassName="py-16">
            <VisitorGuideSection language={activeLanguage} labels={t.visitorGuide} info={visitorGuideInfo} />
          </SectionWrapper>
        </main>
        )}

        {!isSettingsPath && !isMessagesPath && !isCorkboardPath && !isMyClassesPath && !isMyPagePath && !isPrivacyPath && !isLoginConsentPath ? (
        <footer className="border-t border-blue-900/10">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-blue-900/60 md:px-8">{t.footer}</div>
        </footer>
        ) : null}

        {!isSettingsPath && !isMessagesPath && !isCorkboardPath && !isMyClassesPath && !isMyPagePath && !isPrivacyPath && !isLoginConsentPath ? (
          <>
            <div className="h-28 md:hidden" aria-hidden="true" />
            <MobileStickyCta
              label={t.mobileApply}
              onClick={() => scrollToHash("#schedule")}
            />
          </>
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

  if (isAdminPath) {
    return <AdminApp />;
  }

  return <PublicApp />;
}
