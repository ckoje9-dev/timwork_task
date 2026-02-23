import type { Config } from 'tailwindcss';

/**
 * 디자인 토큰 (Design Tokens)
 * 여기서 색상, 폰트, 간격 등 디자인 변수를 중앙 관리합니다.
 * 수정 시 이 파일만 변경하면 전체 UI에 반영됩니다.
 *
 * 브랜드 팔레트
 *   Primary — #3E16BE (RGB 62, 22, 190)  깊은 인디고/바이올렛
 *   Accent  — #ECB843 (RGB 236, 184, 67) 웜 골드
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 브랜드 색상 — 깊은 인디고/바이올렛
        brand: {
          DEFAULT: '#3E16BE',
          dark:    '#2E0F9A',
          light:   '#F0ECFF',
          muted:   '#E5DCFF',
        },
        // 액센트 색상 — 웜 골드
        accent: {
          DEFAULT: '#ECB843',
          dark:    '#D4A030',
          light:   '#FEFBEE',
          muted:   '#FDF1C4',
        },
        // 사이드바
        sidebar: {
          bg:            '#FFFFFF',
          active:        '#3E16BE',
          hover:         '#F5F2FF',
          text:          '#374151',
          'active-text': '#FFFFFF',
          muted:         '#9CA3AF',
        },
        // 콘텐츠 영역 — 극히 미세한 보라 베이스
        surface: {
          DEFAULT: '#F7F6FF',
          card:    '#FFFFFF',
          hover:   '#F0ECFF',
        },
        // 테두리
        border: {
          DEFAULT: '#E5E7EB',
          strong:  '#D1D5DB',
        },
        // 텍스트
        text: {
          primary:   '#111827',
          secondary: '#6B7280',
          muted:     '#9CA3AF',
          inverse:   '#FFFFFF',
        },
        // 상태 색상
        status: {
          todo:          '#6B7280',
          'in-progress': '#F59E0B',
          'in-review':   '#8B5CF6',
          done:          '#10B981',
          urgent:        '#EF4444',
        },
        // 리비전 비교 색상
        revision: {
          r1: '#374151',
          r2: '#3E16BE',  // brand
          r3: '#ECB843',  // accent
          r4: '#10B981',
        },
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
      },
      spacing: {
        sidebar: '240px',
        header:  '64px',
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgb(62 22 190 / 0.07), 0 1px 2px -1px rgb(62 22 190 / 0.05)',
        modal:    '0 20px 60px -10px rgb(62 22 190 / 0.22)',
        dropdown: '0 4px 16px rgb(62 22 190 / 0.10)',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg:      '10px',
        xl:      '14px',
      },
    },
  },
  plugins: [],
};

export default config;
