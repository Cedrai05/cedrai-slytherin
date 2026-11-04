# Cédrai — The Slytherin Archive

슬리데린에서 영감을 받은 Cédrai의 정적 포트폴리오입니다. 원본 포트폴리오의 소개, 활동, 공개 블로그 글, 일정, NOW, 연락처 구조를 간결하게 재구성했습니다.

## 실행

```sh
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. GitHub Pages는 저장소 루트의 `index.html`을 바로 서빙합니다. 빌드 과정은 없습니다.

## 콘텐츠

- `content.json`: 원본 저장소의 공개 블로그 글, 일정, NOW 기록을 복사한 정적 데이터
- `index.html`: 페이지 구조와 링크
- `style.css`: 슬리데린 테마
- `app.js`: 검색, 필터, 달력, 모바일 메뉴

관리자 로그인, 글 작성, 일정 편집 등 서버 기능은 포함하지 않습니다. 활동 카드와 블로그 글은 원본 사이트로 연결됩니다.
