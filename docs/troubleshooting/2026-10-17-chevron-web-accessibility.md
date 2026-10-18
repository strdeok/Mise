# 웹에서 Chevron 접근성 속성 경고

## 증상

Expo 웹 개발 화면에서 `Received false for a non-boolean attribute accessible` 경고가 표시된다.

## 재현 방법

Todo 입력 페이지를 웹 개발 서버에서 연다. 페이지 내 상위 Todo 또는 카테고리 선택 행에 Chevron이 렌더링된다.

## 원인

공용 SVG Chevron이 네이티브와 웹에 동일하게 `accessible={false}`를 전달해, 웹 SVG DOM에서 boolean이 아닌 속성으로 경고가 발생한다.

## 해결

네이티브에서는 기존처럼 접근성 요소에서 제외하고, 웹에서는 `accessible` 속성을 전달하지 않도록 분기한다.

## 검증

수정 후 Expo 웹 개발 화면에서 Todo 입력 페이지와 선택 행을 확인했으며 해당 경고가 더 이상 표시되지 않는다.
