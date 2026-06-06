import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import Markdown from 'react-native-markdown-display';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

// =========================================================================
// [설정] 서버 통신 API 설정
// Expo 환경변수는 EXPO_PUBLIC_ 로 시작해야 클라이언트 코드에 번들링됩니다.
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
// [SVG 아이콘 컴포넌트] 빈티지한 느낌의 화살표 및 신문 아이콘
// =========================================================================
const LeftArrowIcon = ({ color = '#9B3020', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <Path d="M19 12H5M5 12L12 5M5 12L12 19" />
  </Svg>
);

const RightArrowIcon = ({ color = '#9B3020', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" />
  </Svg>
);

const NewspaperIcon = ({ color = '#2C2C2C', size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
    <Path d="M4 6V20C4 20 4 22 7 22C10 22 20 22 20 22V4C20 2.89543 19.1046 2 18 2H7C5.34315 2 4 3.34315 4 5V6Z" fill="#FAF7F0" />
    <Path d="M4 6H16" />
    <Path d="M8 10H16" />
    <Path d="M8 14H16" />
    <Path d="M8 18H12" />
  </Svg>
);

export default function App() {
  const [summaries, setSummaries] = useState([]);
  const [publishedDateStr, setPublishedDateStr] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0); // 로딩 경과 시간 추적용
  
  // 날짜 선택기(DateTimePicker) 상태
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 긴 로딩 대기 안내를 위한 타이머
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

  // 날짜 유틸 함수: YYYY-MM-DD 포맷 변환
  const formatDateString = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 특정 날짜의 데이터를 명시적으로 호출하는 함수
  const fetchSummariesForDate = async (targetDateStr) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_URL}?date=${targetDateStr}`;
      const response = await axios.get(url, { timeout: 60000 }); // LLM 응답 대기를 위해 60초 대기 허용

      if (Array.isArray(response.data) && response.data.length > 0) {
        setSummaries(response.data);
        setPublishedDateStr(targetDateStr);
      } else {
        setSummaries([]);
        setPublishedDateStr(targetDateStr);
        setError("해당 날짜에 발행된 아침 요약본이 없습니다.");
      }
    } catch (err) {
      setSummaries([]); // 이전 데이터가 남아있지 않도록 비우기
      setPublishedDateStr(targetDateStr); // 타임아웃 등의 에러가 발생해도 기준 날짜 UI는 이동시켜야 함

      const isNetworkError = !err.response || err.message.includes('Network') || err.message.includes('timeout') || err.code === 'ECONNREFUSED';
      if (isNetworkError) {
        setError("서버 응답 지연 혹은 연결 실패. (LLM 요약 생성 중일 수 있으니 잠시 후 다시 시도해보세요)");
      } else {
        setError(`데이터 수신 오류 (${err.message})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 앱 초기 구동 시: 최근 5일 중 가장 최신 데이터 탐색
  const fetchLatestSummaries = async () => {
    setIsLoading(true);
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
          const response = await axios.get(url, { timeout: 30000 }); // 초기 역순 탐색 시에도 30초 대기 허용

          if (Array.isArray(response.data) && response.data.length > 0) {
            foundData = response.data;
            fetchedDateStr = dateStr;
            break;
          }
        } catch (err) {
          const isNetworkError = !err.response || err.message.includes('Network') || err.message.includes('timeout') || err.code === 'ECONNREFUSED';
          if (isNetworkError) {
            throw new Error("서버에 연결할 수 없습니다. (네트워크 연결 혹은 백엔드 서버 상태를 확인해 주세요)");
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestSummaries();
  }, []);

  // [기능] 이전/다음 날짜 변경 핸들러
  const changeDate = (daysToAdd) => {
    if (!publishedDateStr) return;

    const parts = publishedDateStr.split('-');
    if (parts.length !== 3) return;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const newDate = new Date(year, month, day);
    newDate.setDate(newDate.getDate() + daysToAdd);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate > today) return;

    const newDateStr = formatDateString(newDate);
    fetchSummariesForDate(newDateStr);
  };

  // [기능] 캘린더 날짜 선택 핸들러
  const onChangeDate = (event, selectedDate) => {
    // 안드로이드는 한 번 렌더링 후 자동으로 닫힘
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
      const newDateStr = formatDateString(selectedDate);
      if (newDateStr !== publishedDateStr) {
        fetchSummariesForDate(newDateStr);
      }
    } else {
      // 선택 취소 시 모달 닫기
      setShowDatePicker(false);
    }
  };

  const getCurrentDateObj = () => {
    if (!publishedDateStr) return new Date();
    const parts = publishedDateStr.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };

  // 날짜 한글 포맷 출력용
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
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("URL 열기 실패:", err);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <NewspaperIcon size={48} color="#2C2C2C" />
        <Text style={styles.loadingTitle}>인쇄기 가동 중...</Text>
        <Text style={styles.loadingSubtitle}>
          활자를 주조하고 신문 지면을 인쇄하는 중입니다.{'\n'}잠시만 기다려 주십시오.
        </Text>
        {loadingTime > 8 && (
          <View style={styles.coldStartNotice}>
            <Text style={styles.coldStartText}>
              [ 통지문 ]{'\n'}오랜만에 인쇄기를 예열하느라 다소 시간이 소요되고 있습니다.{'\n'}(무료 배포 서버 초기화 과정으로 최대 1~2분이 걸릴 수 있습니다)
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const isTodayStr = formatDateString(new Date());
  const isNextDisabled = publishedDateStr === isTodayStr;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 캘린더 모달 UI */}
      {showDatePicker && (
        <DateTimePicker
          value={getCurrentDateObj()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
          maximumDate={new Date()} // 오늘 이후 날짜 선택 방지
        />
      )}

      <View style={styles.header}>
        {/* 서브타이틀 & 신문 아이콘 */}
        <View style={styles.headerTopRow}>
          <NewspaperIcon size={18} color="#2C2C2C" />
          <Text style={styles.headerSubtitle}>DAILY MORNING BRIEFING</Text>
        </View>

        <Text style={styles.headerTitle}>THE HUMBLE POST</Text>
        <Text style={styles.headerKoreanTitle}>겸손은 힘들다 요약본</Text>

        <View style={styles.doubleLineContainer}>
          <View style={styles.thickLine} />
          <View style={styles.thinLine} />
        </View>

        {/* 날짜 네비게이션 영역 */}
        <View style={styles.mastheadInfo}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
            <LeftArrowIcon color="#9B3020" size={14} />
            <Text style={styles.dateNavArrow}>이전 호</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
            <Text style={[styles.mastheadText, styles.boldText, styles.displayDateText]}>
              {getDisplayDate(publishedDateStr)} ▾
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeDate(1)}
            style={[styles.dateNavBtn, isNextDisabled && styles.dateNavBtnDisabled]}
            disabled={isNextDisabled}
          >
            <Text style={[styles.dateNavArrow, isNextDisabled && styles.dateNavTextDisabled]}>
              다음 호
            </Text>
            <RightArrowIcon color={isNextDisabled ? "#888888" : "#9B3020"} size={14} />
          </TouchableOpacity>
        </View>

        <View style={styles.doubleLineContainer}>
          <View style={styles.thinLine} />
          <View style={styles.thickLine} />
        </View>
      </View>

      {error && (!summaries || summaries.length === 0) ? (
        <View style={styles.errorContainerInside}>
          <View style={styles.telegraphBox}>
            <Text style={styles.telegraphTitle}>[ 통지문 ]</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSummariesForDate(publishedDateStr)}>
            <Text style={styles.retryButtonText}>전보 다시 요청 (재호출)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sampleButton}
            onPress={() => {
              setSummaries(MOCK_SUMMARIES);
              setPublishedDateStr("2026-06-05");
              setError(null);
            }}
          >
            <Text style={styles.sampleButtonText}>임시 오프라인 샘플 읽기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.editorialSection}>
            <Text style={styles.editorialTitle}>◈ 아침 주요 대담 요약본 ◈</Text>
          </View>

          {summaries.map((item, index) => (
            <View key={item.id || index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>인터뷰 요약</Text>
                </View>
                <Text style={styles.cardNoText}>SECTION {index + 1}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>

              <View style={styles.markdownWrapper}>
                <Markdown style={markdownStyles}>
                  {item.summary || "내용이 없습니다."}
                </Markdown>
              </View>

              <View style={styles.cardDivider} />

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleOpenURL(item.content_url || item.url)}
                activeOpacity={0.7}
              >
                <Text style={styles.linkButtonText}>원문 기사 보기 ☞</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>- THE HUMBLE POST -</Text>
            <Text style={styles.footerSubText}>인쇄 및 편집: 뉴스공장 요약팀</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const fontSerif = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const fontMonospace = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// 마크다운 커스텀 스타일 (빈티지 신문 컨셉)
const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: fontSerif,
    fontSize: 15,
    color: '#2C2C2C',
    lineHeight: 24,
    textAlign: 'justify',
  },
  heading1: { fontFamily: fontSerif, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  heading2: { fontFamily: fontSerif, fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  heading3: { fontFamily: fontSerif, fontSize: 15, fontWeight: 'bold', marginVertical: 6 },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginTop: 4, marginBottom: 8 },
  ordered_list: { marginTop: 4, marginBottom: 8 },
  bullet_list_icon: { color: '#2C2C2C', fontSize: 16, marginRight: 4, marginLeft: 0 },
  list_item: { marginBottom: 6, flexDirection: 'row' },
  paragraph: { marginVertical: 6 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  scrollContainer: {
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fontSerif,
    fontSize: 10,
    letterSpacing: 2,
    color: '#2C2C2C',
    fontWeight: '600',
    marginLeft: 6,
  },
  headerTitle: {
    fontFamily: fontSerif,
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 1,
    letterSpacing: -1,
  },
  headerKoreanTitle: {
    fontFamily: fontSerif,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    letterSpacing: 1,
    marginBottom: 8,
  },
  doubleLineContainer: { width: '100%', marginVertical: 2 },
  thickLine: { borderBottomWidth: 2, borderColor: '#2C2C2C', marginBottom: 2 },
  thinLine: { borderBottomWidth: 1, borderColor: '#2C2C2C' },

  mastheadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  dateNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2DEC3',
    backgroundColor: '#FAF7F0',
  },
  dateNavBtnDisabled: {
    opacity: 0.4,
  },
  dateNavArrow: {
    fontFamily: fontSerif,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9B3020',
    marginHorizontal: 4,
  },
  dateNavTextDisabled: {
    color: '#888888',
  },
  datePickerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mastheadText: { fontFamily: fontSerif, fontSize: 13, color: '#2C2C2C' },
  boldText: { fontWeight: 'bold' },
  displayDateText: { fontSize: 14, letterSpacing: 0.5, color: '#2C2C2C' },

  editorialSection: {
    alignItems: 'center',
    marginVertical: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderStyle: 'dashed',
  },
  editorialTitle: {
    fontFamily: fontSerif,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C2C2C',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardBadge: { borderWidth: 1, borderColor: '#9B3020', paddingHorizontal: 6, paddingVertical: 2 },
  cardBadgeText: { fontFamily: fontSerif, fontSize: 10, color: '#9B3020', fontWeight: 'bold' },
  cardNoText: { fontFamily: fontSerif, fontSize: 10, color: '#555555', fontWeight: '600' },

  cardTitle: {
    fontFamily: fontSerif,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2C',
    lineHeight: 28,
    marginBottom: 6,
  },

  markdownWrapper: {
    marginTop: 4,
    marginBottom: 4,
  },

  cardDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2DEC3',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  linkButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    backgroundColor: '#2C2C2C',
  },
  linkButtonText: { fontFamily: fontSerif, fontSize: 12, color: '#F4F1EA', fontWeight: 'bold' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F1EA', padding: 24 },
  loadingTitle: { fontFamily: fontSerif, fontSize: 20, fontWeight: 'bold', color: '#2C2C2C', marginTop: 18, marginBottom: 8 },
  loadingSubtitle: { fontFamily: fontSerif, fontSize: 13, color: '#666666', textAlign: 'center', lineHeight: 18 },

  coldStartNotice: { marginTop: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#9B3020', borderStyle: 'dashed', backgroundColor: '#FAF7F0', width: '80%' },
  coldStartText: { fontFamily: fontSerif, fontSize: 12, color: '#9B3020', textAlign: 'center', lineHeight: 18, fontWeight: 'bold' },

  errorContainerInside: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, marginTop: 40 },
  telegraphBox: { borderWidth: 1, borderColor: '#2C2C2C', padding: 20, backgroundColor: '#FAF7F0', alignItems: 'center', width: '100%', marginBottom: 20 },
  telegraphTitle: { fontFamily: fontSerif, fontSize: 16, fontWeight: 'bold', color: '#9B3020', marginBottom: 10 },
  errorSubtitle: { fontFamily: fontSerif, fontSize: 13, color: '#2C2C2C', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  retryButton: { backgroundColor: '#2C2C2C', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', width: '100%', marginBottom: 10 },
  retryButtonText: { fontFamily: fontSerif, fontSize: 13, fontWeight: 'bold', color: '#F4F1EA' },
  sampleButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2C2C2C', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', width: '100%' },
  sampleButtonText: { fontFamily: fontSerif, fontSize: 13, fontWeight: 'bold', color: '#2C2C2C' },

  footer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  footerText: { fontFamily: fontSerif, fontSize: 12, fontWeight: 'bold', color: '#888888', letterSpacing: 2 },
  footerSubText: { fontFamily: fontSerif, fontSize: 10, color: '#AAAAAA', marginTop: 4 },
});
