import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Linking,
  Animated,
  Easing,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  NanumMyeongjo_400Regular,
  NanumMyeongjo_700Bold,
  NanumMyeongjo_800ExtraBold,
} from '@expo-google-fonts/nanum-myeongjo';
import * as SplashScreen from 'expo-splash-screen';
import axios from 'axios';
import Markdown from 'react-native-markdown-display';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

// 스플래시 화면을 폰트 로딩까지 유지
SplashScreen.preventAutoHideAsync();

// =========================================================================
// [설정] 서버 통신 API 설정
// =========================================================================
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/today-summaries';

// -------------------------------------------------------------------------
// [샘플 데이터]
// -------------------------------------------------------------------------
const MOCK_SUMMARIES = [
  {
    id: 1,
    title: "글로벌 공급망 재편과 대한민국의 기술 생존 전략",
    publish_date: "2026-06-05",
    url: "https://youtube.com",
    summary: `**[주요 대담자]**\n최배근 교수 (건국대 경제학과)\n\n**[핵심 요약]**\n* 미·중 갈등에 따른 동아시아 정세 변화와 신(新)보호무역주의 도래 분석\n* 국내 핵심 부품 및 소재 자립도 제고를 위한 정부 중심의 파격적 R&D 지원 필요성 강조\n* 단기 실적 일희일비보다는 기초 원천기술 확보와 공급망 다변화가 필수적임을 피력`
  },
  {
    id: 2,
    title: "지속가능한 에너지 특별법 통과와 지역 분산형 전력망 개혁",
    publish_date: "2026-06-04",
    url: "https://youtube.com",
    summary: `**[주요 대담자]**\n김지윤 박사 (에너지전환정책연구소)\n\n**[핵심 요약]**\n* 새로 통과된 에너지 활성화 법안이 국내 송·배전망 체계에 미칠 파장 설명\n* 발전 시설 집중 지역과 전력 대량 소비 지역 간의 불균형 해소 방안 제안\n* 지역별 차등 전기요금제 도입 시 예상되는 제조 산업 분산 효과와 민원 조율책 마련 촉구`
  }
];

// =========================================================================
// [SVG 아이콘 컴포넌트]
// =========================================================================
const LeftArrowIcon = ({ color = '#9B3020', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 18L9 12L15 6" />
  </Svg>
);

const RightArrowIcon = ({ color = '#9B3020', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 6L15 12L9 18" />
  </Svg>
);

const NewspaperIcon = ({ color = '#2C2C2C', size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="1" fill="#FAF7F0" />
    <Line x1="7" y1="7" x2="17" y2="7" strokeWidth="2" />
    <Line x1="7" y1="11" x2="17" y2="11" />
    <Line x1="7" y1="14" x2="17" y2="14" />
    <Line x1="7" y1="17" x2="12" y2="17" />
  </Svg>
);

const PrintingPressIcon = ({ color = '#2C2C2C', size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* 신문 */}
    <Rect x="14" y="8" width="36" height="48" rx="2" fill="#FAF7F0" />
    <Line x1="20" y1="16" x2="44" y2="16" strokeWidth="2.5" />
    <Line x1="20" y1="22" x2="44" y2="22" />
    <Line x1="20" y1="27" x2="44" y2="27" />
    <Line x1="20" y1="32" x2="36" y2="32" />
    {/* 장식 테두리 */}
    <Rect x="18" y="38" width="12" height="10" rx="1" strokeWidth="1" />
    <Line x1="34" y1="40" x2="44" y2="40" />
    <Line x1="34" y1="44" x2="44" y2="44" />
    <Line x1="34" y1="48" x2="40" y2="48" />
  </Svg>
);

const CalendarIcon = ({ color = '#2C2C2C', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

// =========================================================================
// [애니메이션 컴포넌트] 로딩 화면용 프린팅 프레스 애니메이션
// =========================================================================
const AnimatedLoadingScreen = ({ loadingTime, isInitial }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const coldStartFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 아이콘 펄스 애니메이션 (숨쉬기)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 텍스트 페이드인 + 슬라이드업
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // 프로그레스 바 반복 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progressAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();

    // 점 깜빡임 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cold start 안내 페이드인
  useEffect(() => {
    if (loadingTime > 8) {
      Animated.timing(coldStartFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [loadingTime > 8]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.loadingInner}>
      {/* 애니메이션 아이콘 */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <PrintingPressIcon size={64} color="#2C2C2C" />
      </Animated.View>

      {/* 텍스트 영역 - 슬라이드업 + 페이드인 */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={styles.loadingTitle}>
          {isInitial ? '조간신문 인쇄 중' : '호외 인쇄 중'}
        </Text>
        <Text style={styles.loadingSubtitle}>
          활자를 주조하고 지면을 조판하고 있습니다
        </Text>
      </Animated.View>

      {/* 프로그레스 바 */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
      </View>

      {/* 경과 시간 표시 */}
      <Animated.View style={{ opacity: dotAnim }}>
        <Text style={styles.loadingElapsed}>{loadingTime}초 경과</Text>
      </Animated.View>

      {/* Cold Start 안내 (8초 이상) */}
      {loadingTime > 8 && (
        <Animated.View style={[styles.coldStartNotice, { opacity: coldStartFade }]}>
          <Text style={styles.coldStartLabel}>◆ 통지문 ◆</Text>
          <Text style={styles.coldStartText}>
            오랜만에 인쇄기를 예열하느라{'\n'}다소 시간이 소요되고 있습니다.
          </Text>
          <Text style={styles.coldStartSub}>
            (무료 배포 서버 초기화 과정으로{'\n'}최대 1~2분이 걸릴 수 있습니다)
          </Text>
        </Animated.View>
      )}
    </View>
  );
};


// =========================================================================
// [스크롤 리빌 컴포넌트] 뷰포트 진입 시 한 번만 페이드인+슬라이드업
// =========================================================================
const ScrollRevealCard = ({ children, scrollY, style }) => {
  const { height: screenHeight } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const hasRevealed = useRef(false);
  const cardY = useRef(0);

  const reveal = useCallback(() => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 레이아웃 완료 시: 위치 저장 + 이미 뷰포트 안이면 즉시 등장
  const handleLayout = (event) => {
    cardY.current = event.nativeEvent.layout.y;
    const currentScroll = scrollY._value !== undefined ? scrollY._value : 0;
    if (currentScroll + screenHeight > cardY.current - 20) {
      reveal();
    }
  };

  // 스크롤 리스너: 카드가 뷰포트에 진입하면 등장
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (hasRevealed.current) return;
      if (cardY.current > 0 && value + screenHeight > cardY.current - 20) {
        reveal();
      }
    });
    return () => scrollY.removeListener(id);
  }, [screenHeight, reveal]);

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {children}
    </Animated.View>
  );
};


// =========================================================================
// [메인 앱 컴포넌트]
// =========================================================================
export default function App() {
  // 폰트 로딩
  const [fontsLoaded] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    NanumMyeongjo_800ExtraBold,
  });

  const [summaries, setSummaries] = useState([]);
  const [publishedDateStr, setPublishedDateStr] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 앱 최초 로딩
  const [isContentLoading, setIsContentLoading] = useState(false); // 콘텐츠만 로딩 (헤더 유지)
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date()); // 확정 전 임시 날짜

  // 카드 페이드인 애니메이션
  const contentFade = useRef(new Animated.Value(0)).current;
  // 스크롤 위치 추적 (ScrollRevealCard에 전달)
  const scrollY = useRef(new Animated.Value(0)).current;

  // 로딩 경과 시간 타이머
  const isLoading = isInitialLoading || isContentLoading;
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // 콘텐츠 로딩 완료 시 페이드인
  useEffect(() => {
    if (!isLoading && summaries.length > 0) {
      contentFade.setValue(0);
      Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [isLoading, summaries]);

  // 폰트 로딩 완료 시 스플래시 닫기
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 날짜 유틸
  const formatDateString = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 특정 날짜의 데이터 호출 (헤더 유지, 콘텐츠만 로딩)
  const fetchSummariesForDate = async (targetDateStr) => {
    setIsContentLoading(true);
    setError(null);
    setPublishedDateStr(targetDateStr);
    try {
      const url = `${API_URL}?date=${targetDateStr}`;
      const response = await axios.get(url, { timeout: 60000 });

      if (Array.isArray(response.data) && response.data.length > 0) {
        setSummaries(response.data);
      } else {
        setSummaries([]);
        setError("해당 날짜에 발행된 요약본이 없습니다.");
      }
    } catch (err) {
      setSummaries([]);
      const isNetworkError = !err.response || err.message.includes('Network') || err.message.includes('timeout') || err.code === 'ECONNREFUSED';
      if (isNetworkError) {
        setError("서버 응답 지연 혹은 연결 실패.\nLLM 요약 생성 중일 수 있으니 잠시 후 다시 시도해보세요.");
      } else {
        setError(`데이터 수신 오류 (${err.message})`);
      }
    } finally {
      setIsContentLoading(false);
    }
  };

  // 최초 로딩: 최근 5일간 역순 탐색
  const fetchLatestSummaries = async () => {
    setIsInitialLoading(true);
    setError(null);

    let foundData = [];
    let fetchedDateStr = "";
    let currentDate = new Date();
    let attempts = 0;
    const maxAttempts = 5;

    try {
      while (attempts < maxAttempts) {
        const dateStr = formatDateString(currentDate);
        try {
          const url = `${API_URL}?date=${dateStr}`;
          const response = await axios.get(url, { timeout: 30000 });

          if (Array.isArray(response.data) && response.data.length > 0) {
            foundData = response.data;
            fetchedDateStr = dateStr;
            break;
          }
        } catch (err) {
          const isNetworkError = !err.response || err.message.includes('Network') || err.message.includes('timeout') || err.code === 'ECONNREFUSED';
          if (isNetworkError) {
            throw new Error("서버에 연결할 수 없습니다.\n네트워크 연결 혹은 백엔드 서버 상태를 확인해 주세요.");
          }
        }
        currentDate.setDate(currentDate.getDate() - 1);
        attempts++;
      }

      if (foundData.length > 0) {
        setSummaries(foundData);
        setPublishedDateStr(fetchedDateStr);
      } else {
        setPublishedDateStr(formatDateString(new Date()));
        setError("최근 5일간 인쇄된 아침 요약본을 찾지 못했습니다.");
      }
    } catch (outerErr) {
      setPublishedDateStr(formatDateString(new Date()));
      setError(outerErr.message || "데이터 수신 과정에서 오류가 발생했습니다.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (fontsLoaded) {
      fetchLatestSummaries();
    }
  }, [fontsLoaded]);

  // 날짜 이동
  const changeDate = (daysToAdd) => {
    if (!publishedDateStr || isContentLoading) return;
    const parts = publishedDateStr.split('-');
    if (parts.length !== 3) return;
    const newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    newDate.setDate(newDate.getDate() + daysToAdd);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate > today) return;

    fetchSummariesForDate(formatDateString(newDate));
  };

  // 캘린더 날짜 선택 (임시 저장만, 확정은 별도 버튼)
  const onTempDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // 안드로이드는 자체 확인/취소 UI가 있으므로 즉시 처리
      setShowDatePicker(false);
      if (selectedDate) {
        const newDateStr = formatDateString(selectedDate);
        if (newDateStr !== publishedDateStr) {
          fetchSummariesForDate(newDateStr);
        }
      }
    } else {
      // iOS: 스피너 값만 임시 저장 (확정은 confirmDateSelection에서)
      if (selectedDate) {
        setTempSelectedDate(selectedDate);
      }
    }
  };

  // iOS 전용: 날짜 확정
  const confirmDateSelection = () => {
    setShowDatePicker(false);
    const newDateStr = formatDateString(tempSelectedDate);
    if (newDateStr !== publishedDateStr) {
      fetchSummariesForDate(newDateStr);
    }
  };

  // 날짜 선택 취소
  const cancelDateSelection = () => {
    setShowDatePicker(false);
    setTempSelectedDate(getCurrentDateObj()); // 원래 날짜로 복원
  };

  // DatePicker 열 때 현재 날짜를 임시값으로 세팅
  const openDatePicker = () => {
    setTempSelectedDate(getCurrentDateObj());
    setShowDatePicker(true);
  };

  const getCurrentDateObj = () => {
    if (!publishedDateStr) return new Date();
    const parts = publishedDateStr.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  const getDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const dayVal = parseInt(parts[2], 10);
      const targetDate = new Date(year, month - 1, dayVal);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const day = dayNames[targetDate.getDay()];
      return `${year}년 ${month}월 ${dayVal}일 (${day})`;
    } catch {
      return dateString;
    }
  };

  const handleOpenURL = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) {
      console.error("URL 열기 실패:", err);
    }
  };

  if (!fontsLoaded) return null;

  const isTodayStr = formatDateString(new Date());
  const isNextDisabled = publishedDateStr === isTodayStr;

  // =====================================================================
  // [렌더링] 앱 최초 로딩 화면 (헤더 없이 전체 화면)
  // =====================================================================
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} onLayout={onLayoutRootView}>
        <StatusBar style="dark" />
        <AnimatedLoadingScreen loadingTime={loadingTime} isInitial={true} />
      </SafeAreaView>
    );
  }

  // =====================================================================
  // [렌더링] 메인 화면 (헤더 항상 표시, 콘텐츠만 전환)
  // =====================================================================
  return (
    <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />

      {/* 캘린더 모달 (iOS: 확인/취소 버튼 포함 오버레이) */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempSelectedDate}
          mode="date"
          display="default"
          onChange={onTempDateChange}
          maximumDate={new Date()}
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContainer}>
              {/* 모달 헤더 */}
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={cancelDateSelection} style={styles.dateModalBtn}>
                  <Text style={styles.dateModalCancelText}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>날짜 선택</Text>
                <TouchableOpacity onPress={confirmDateSelection} style={styles.dateModalBtn}>
                  <Text style={styles.dateModalConfirmText}>선택 완료</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateModalDivider} />
              {/* 스피너 */}
              <DateTimePicker
                value={tempSelectedDate}
                mode="date"
                display="spinner"
                onChange={onTempDateChange}
                maximumDate={new Date()}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ─── 고정 헤더 ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerDecoLine} />
          <Text style={styles.headerSubtitle}>DAILY MORNING BRIEFING</Text>
          <View style={styles.headerDecoLine} />
        </View>

        <Text style={styles.headerTitle}>THE HUMBLE POST</Text>
        <Text style={styles.headerKoreanTitle}>겸손은 힘들다 요약본</Text>

        <View style={styles.doubleLineContainer}>
          <View style={styles.thickLine} />
          <View style={styles.thinLine} />
        </View>

        {/* 날짜 네비게이션 */}
        <View style={styles.dateNavRow}>
          <TouchableOpacity
            onPress={() => changeDate(-1)}
            style={styles.dateNavBtn}
            activeOpacity={0.6}
            disabled={isContentLoading}
          >
            <LeftArrowIcon color="#9B3020" size={16} />
            <Text style={styles.dateNavLabel}>이전 호</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openDatePicker}
            style={styles.datePickerBtn}
            activeOpacity={0.7}
          >
            <CalendarIcon color="#555" size={13} />
            <Text style={styles.displayDateText}>
              {getDisplayDate(publishedDateStr)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeDate(1)}
            style={[styles.dateNavBtn, isNextDisabled && styles.dateNavBtnDisabled]}
            disabled={isNextDisabled || isContentLoading}
            activeOpacity={0.6}
          >
            <Text style={[styles.dateNavLabel, isNextDisabled && styles.dateNavTextDisabled]}>
              다음 호
            </Text>
            <RightArrowIcon color={isNextDisabled ? "#AAAAAA" : "#9B3020"} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.doubleLineContainer}>
          <View style={styles.thinLine} />
          <View style={styles.thickLine} />
        </View>
      </View>

      {/* ─── 콘텐츠 영역 ─── */}
      {isContentLoading ? (
        <View style={styles.contentLoadingContainer}>
          <AnimatedLoadingScreen loadingTime={loadingTime} isInitial={false} />
        </View>
      ) : error && (!summaries || summaries.length === 0) ? (
        <ScrollView contentContainerStyle={styles.errorScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.errorContainer}>
            <View style={styles.telegraphBox}>
              <View style={styles.telegraphBorder}>
                <Text style={styles.telegraphTitle}>◆ 통지문 ◆</Text>
                <View style={styles.telegraphDivider} />
                <Text style={styles.errorSubtitle}>{error}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchSummariesForDate(publishedDateStr)}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>↻  다시 요청</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sampleButton}
              onPress={() => {
                setSummaries(MOCK_SUMMARIES);
                setPublishedDateStr("2026-06-05");
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sampleButtonText}>오프라인 샘플 읽기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentFade }}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            <View style={styles.editorialSection}>
              <Text style={styles.editorialDeco}>✦</Text>
              <Text style={styles.editorialTitle}>아침 주요 대담 요약</Text>
              <Text style={styles.editorialDeco}>✦</Text>
            </View>

            {summaries.map((item, index) => (
              <ScrollRevealCard key={item.id || index} scrollY={scrollY} style={styles.card}>
                {/* 카드 헤더 */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>INTERVIEW</Text>
                  </View>
                  <View style={styles.cardSectionLine} />
                  <Text style={styles.cardNoText}>§ {index + 1}</Text>
                </View>

                {/* 제목 */}
                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.cardTitleUnderline} />

                {/* 마크다운 본문 */}
                <View style={styles.markdownWrapper}>
                  <Markdown style={markdownStyles}>
                    {item.summary || "내용이 없습니다."}
                  </Markdown>
                </View>

                {/* 하단 링크 */}
                <View style={styles.cardFooter}>
                  <View style={styles.cardFooterLine} />
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleOpenURL(item.content_url || item.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkButtonText}>원문 보기 →</Text>
                  </TouchableOpacity>
                </View>
              </ScrollRevealCard>
            ))}

            <View style={styles.footer}>
              <View style={styles.footerDecoLine} />
              <Text style={styles.footerText}>THE HUMBLE POST</Text>
              <Text style={styles.footerSubText}>뉴스공장 · 매일 아침 요약</Text>
              <View style={styles.footerDecoLine} />
            </View>
          </Animated.ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// =========================================================================
// [스타일] 폰트 정의
// =========================================================================
const fontSerif = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const fontKR = 'NanumMyeongjo_400Regular';
const fontKRBold = 'NanumMyeongjo_700Bold';
const fontKRExtra = 'NanumMyeongjo_800ExtraBold';

// 마크다운 스타일
const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: fontKR,
    fontSize: 14.5,
    color: '#333333',
    lineHeight: 24,
  },
  heading1: { fontFamily: fontKRBold, fontSize: 18, fontWeight: 'bold', marginVertical: 8, color: '#2C2C2C' },
  heading2: { fontFamily: fontKRBold, fontSize: 16, fontWeight: 'bold', marginVertical: 8, color: '#2C2C2C' },
  heading3: { fontFamily: fontKRBold, fontSize: 15, fontWeight: 'bold', marginVertical: 6, color: '#2C2C2C' },
  strong: { fontFamily: fontKRBold, fontWeight: 'bold', color: '#2C2C2C' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginTop: 4, marginBottom: 8 },
  ordered_list: { marginTop: 4, marginBottom: 8 },
  bullet_list_icon: { color: '#9B3020', fontSize: 6, marginRight: 8, marginTop: 8 },
  list_item: { marginBottom: 4, flexDirection: 'row' },
  paragraph: { marginVertical: 5 },
});

// 메인 스타일
const styles = StyleSheet.create({
  // ── 레이아웃 ──
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  scrollContainer: {
    paddingBottom: 50,
  },

  // ── 로딩 화면 ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F1EA',
    padding: 24,
  },
  contentLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInner: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontFamily: fontKRBold,
    fontSize: 20,
    color: '#2C2C2C',
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontFamily: fontKR,
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressBarTrack: {
    width: 180,
    height: 3,
    backgroundColor: '#E2DEC3',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9B3020',
    borderRadius: 2,
  },
  loadingElapsed: {
    fontFamily: fontSerif,
    fontSize: 11,
    color: '#AAAAAA',
    letterSpacing: 1,
  },
  coldStartNotice: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#C8A882',
    backgroundColor: '#FAF7F0',
    alignItems: 'center',
  },
  coldStartLabel: {
    fontFamily: fontKRBold,
    fontSize: 12,
    color: '#9B3020',
    marginBottom: 8,
    letterSpacing: 2,
  },
  coldStartText: {
    fontFamily: fontKR,
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  coldStartSub: {
    fontFamily: fontKR,
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── 헤더 ──
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerDecoLine: {
    width: 32,
    height: 1,
    backgroundColor: '#C8A882',
    marginHorizontal: 10,
  },
  headerSubtitle: {
    fontFamily: fontSerif,
    fontSize: 9,
    letterSpacing: 3,
    color: '#999999',
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: fontSerif,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C2C2C',
    letterSpacing: -0.5,
  },
  headerKoreanTitle: {
    fontFamily: fontKRBold,
    fontSize: 13,
    color: '#555555',
    letterSpacing: 4,
    marginTop: 2,
    marginBottom: 8,
  },
  doubleLineContainer: { width: '100%', marginVertical: 2 },
  thickLine: { borderBottomWidth: 2.5, borderColor: '#2C2C2C', marginBottom: 2 },
  thinLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#2C2C2C' },

  // ── 날짜 네비게이션 ──
  dateNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 7,
  },
  dateNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  dateNavBtnDisabled: {
    opacity: 0.3,
  },
  dateNavLabel: {
    fontFamily: fontKR,
    fontSize: 12,
    color: '#9B3020',
    marginHorizontal: 3,
  },
  dateNavTextDisabled: {
    color: '#AAAAAA',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#C8A882',
  },
  displayDateText: {
    fontFamily: fontKRBold,
    fontSize: 14,
    color: '#2C2C2C',
    marginLeft: 6,
  },

  // ── 에디토리얼 섹션 ──
  editorialSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingVertical: 8,
  },
  editorialTitle: {
    fontFamily: fontKRBold,
    fontSize: 14,
    color: '#2C2C2C',
    letterSpacing: 2,
    marginHorizontal: 10,
  },
  editorialDeco: {
    fontFamily: fontSerif,
    fontSize: 10,
    color: '#C8A882',
  },

  // ── 카드 ──
  card: {
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#D5CFC0',
    padding: 22,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardBadge: {
    borderWidth: 1,
    borderColor: '#9B3020',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardBadgeText: {
    fontFamily: fontSerif,
    fontSize: 9,
    color: '#9B3020',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardSectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D5CFC0',
    marginHorizontal: 12,
  },
  cardNoText: {
    fontFamily: fontSerif,
    fontSize: 12,
    color: '#C8A882',
    fontWeight: '600',
  },
  cardTitle: {
    fontFamily: fontKRExtra,
    fontSize: 20,
    color: '#2C2C2C',
    lineHeight: 30,
    marginBottom: 4,
  },
  cardTitleUnderline: {
    height: 2,
    backgroundColor: '#9B3020',
    width: 40,
    marginBottom: 14,
    marginTop: 4,
  },
  markdownWrapper: {
    marginTop: 2,
    marginBottom: 4,
  },
  cardFooter: {
    marginTop: 10,
  },
  cardFooterLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D5CFC0',
    marginBottom: 14,
  },
  linkButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  linkButtonText: {
    fontFamily: fontKR,
    fontSize: 12,
    color: '#2C2C2C',
  },

  // ── 에러 화면 ──
  errorScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  telegraphBox: {
    width: '100%',
    marginBottom: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: '#C8A882',
  },
  telegraphBorder: {
    borderWidth: 1,
    borderColor: '#C8A882',
    padding: 24,
    alignItems: 'center',
  },
  telegraphTitle: {
    fontFamily: fontKRBold,
    fontSize: 14,
    color: '#9B3020',
    marginBottom: 12,
    letterSpacing: 2,
  },
  telegraphDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#C8A882',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontFamily: fontKR,
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2C2C2C',
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  retryButtonText: {
    fontFamily: fontKRBold,
    fontSize: 13,
    color: '#F4F1EA',
  },
  sampleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C8A882',
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  sampleButtonText: {
    fontFamily: fontKR,
    fontSize: 13,
    color: '#555555',
  },

  // ── 푸터 ──
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerDecoLine: {
    width: 60,
    height: 1,
    backgroundColor: '#D5CFC0',
    marginVertical: 8,
  },
  footerText: {
    fontFamily: fontSerif,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#AAAAAA',
    letterSpacing: 3,
  },
  footerSubText: {
    fontFamily: fontKR,
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 4,
    letterSpacing: 1,
  },

  // ── 날짜 선택 모달 (iOS) ──
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 44, 0.4)',
    justifyContent: 'flex-end',
  },
  dateModalContainer: {
    backgroundColor: '#F4F1EA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dateModalTitle: {
    fontFamily: fontKRBold,
    fontSize: 15,
    color: '#2C2C2C',
    letterSpacing: 1,
  },
  dateModalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dateModalCancelText: {
    fontFamily: fontKR,
    fontSize: 14,
    color: '#999999',
  },
  dateModalConfirmText: {
    fontFamily: fontKRBold,
    fontSize: 14,
    color: '#9B3020',
  },
  dateModalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C8A882',
    marginHorizontal: 16,
  },
});
