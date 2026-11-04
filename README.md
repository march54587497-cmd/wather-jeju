# 지금 제주 날씨는?

HTML, CSS, JavaScript로 만든 제주 현재 날씨 웹앱입니다.

## 실행

1. 이 폴더에서 `node preview.cjs`를 실행합니다.
2. 브라우저에서 http://127.0.0.1:8765/ 를 엽니다.
3. WeatherAPI 연결 설정에 본인의 API 키를 입력하고 **저장하고 불러오기**를 누릅니다.

API 키 발급: https://www.weatherapi.com/signup.aspx

키를 저장한 브라우저에서는 페이지를 열 때 자동으로 날씨를 요청합니다. **새로고침**을 누르면 다시 요청합니다. 키는 해당 브라우저의 localStorage에 저장되며 화면에서 삭제할 수 있습니다.

## 데이터

- 요청 주소: `https://api.weatherapi.com/v1/current.json`
- 제주 좌표: `33.4996,126.5312`
- 한국어 설명: `lang=ko`
- 표시 항목: `temp_c`, `humidity`, `condition.text`, `last_updated`

## 파일

- `dist/index.html`: 화면
- `dist/style.css`: 반응형 스타일
- `dist/app.js`: API 요청과 화면 갱신
- `preview.cjs`: 로컬 서버

`node verify.cjs`로 모의 응답을 사용한 자동 불러오기, 표시, 새로고침, 오류 처리, 키 삭제 동작을 확인할 수 있습니다. 실제 API 연결에는 유효한 키가 필요합니다.
