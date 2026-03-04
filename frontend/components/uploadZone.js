import { createMockMeeting, startMockUpload } from '../api/meetingsApi.js';

export function mountUploadZone(rootElement, options = {}) {
  const onComplete = options.onComplete || (() => {});
  const workspace = options.workspace || { id: 'ws-mock', name: 'Mock Workspace' };
  const container = document.createElement('section');
  container.className = 'upload-zone';
  container.innerHTML = `
    <div class="upload-header">
      <p class="eyebrow">Mock Upload Workspace</p>
      <h3>회의 생성 후 업로드</h3>
      <p class="muted">API와 DB 연결 전 단계이므로 현재 화면은 Presigned URL 업로드 UX를 목업으로 재현합니다.</p>
      <p class="muted">현재 선택 워크스페이스: <strong>${workspace.name}</strong></p>
    </div>
    <div class="upload-form">
      <label class="field">
        <span>회의 제목</span>
        <input type="text" id="meeting-title-input" placeholder="예: 주간 스프린트 회의" />
      </label>
      <label class="field">
        <span>회의 일시</span>
        <input type="datetime-local" id="meeting-date-input" />
      </label>
      <label class="field">
        <span>참여자</span>
        <input type="text" id="meeting-participants-input" placeholder="예: 민수, 지현, 영호" />
      </label>
    </div>
    <div class="upload-drop">
      <p><strong>Drag & Drop</strong> 또는 파일 선택</p>
      <p class="muted">지원 포맷: m4a / 최대 30MB / S3 Presigned URL 업로드 흐름</p>
      <p class="muted">${workspace.type === 'PERSONAL' ? '개인 음성 업로드' : '워크스페이스 회의 업로드'} 기준으로 저장됩니다.</p>
      <input type="file" id="file-input" accept=".m4a,audio/mp4" hidden />
      <div class="upload-actions">
        <button class="btn" id="select-file-btn" type="button">파일 선택</button>
        <button class="btn btn-primary" id="start-upload-btn" type="button">업로드 시작</button>
      </div>
      <p id="selected-file-name" class="muted">선택된 파일 없음</p>
    </div>
    <div class="upload-progress hidden" id="progress-wrap">
      <div class="progress-meta">
        <strong id="progress-step">대기 중</strong>
        <span id="progress-percent">0%</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
      <p class="muted" id="progress-text">회의 생성 전입니다.</p>
    </div>
  `;

  const fileInput = container.querySelector('#file-input');
  const selectBtn = container.querySelector('#select-file-btn');
  const startBtn = container.querySelector('#start-upload-btn');
  const titleInput = container.querySelector('#meeting-title-input');
  const dateInput = container.querySelector('#meeting-date-input');
  const participantsInput = container.querySelector('#meeting-participants-input');
  const selectedFileName = container.querySelector('#selected-file-name');
  const progressWrap = container.querySelector('#progress-wrap');
  const progressBar = container.querySelector('#progress-bar');
  const progressText = container.querySelector('#progress-text');
  const progressStep = container.querySelector('#progress-step');
  const progressPercent = container.querySelector('#progress-percent');

  let selectedFile = null;

  function updateProgress(percent, step, text) {
    progressWrap.classList.remove('hidden');
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressStep.textContent = step;
    progressText.textContent = text;
  }

  function validateFile(file) {
    if (!file) {
      throw new Error('업로드할 파일을 선택해주세요.');
    }
    if (!file.name.toLowerCase().endsWith('.m4a')) {
      throw new Error('m4a 파일만 업로드할 수 있습니다.');
    }
    if (file.size > 30 * 1024 * 1024) {
      throw new Error('파일 크기는 30MB 이하여야 합니다.');
    }
  }

  function handleFile(file) {
    selectedFile = file;
    selectedFileName.textContent = file ? `${file.name} 선택됨` : '선택된 파일 없음';
  }

  async function runMockUpload() {
    try {
      validateFile(selectedFile);

      if (!titleInput.value.trim()) {
        throw new Error('회의 제목을 입력해주세요.');
      }

      if (!dateInput.value) {
        throw new Error('회의 일시를 입력해주세요.');
      }

      startBtn.disabled = true;
      updateProgress(10, '회의 생성', '회의 메타데이터를 생성하고 있습니다.');

      const meeting = await createMockMeeting({
        title: titleInput.value,
        date: new Date(dateInput.value).toISOString(),
        participants: participantsInput.value,
        fileName: selectedFile.name,
        workspaceId: workspace.id,
        workspaceName: workspace.name
      });

      updateProgress(35, 'Presigned URL 발급', '업로드 경로를 준비하고 있습니다.');
      await startMockUpload(meeting.id, { fileName: selectedFile.name });

      let progress = 35;
      const timer = window.setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 7;
        if (progress >= 100) {
          progress = 100;
          window.clearInterval(timer);
          updateProgress(100, '업로드 완료', '상세 화면으로 이동합니다.');
          window.setTimeout(() => {
            onComplete(meeting);
          }, 350);
          return;
        }

        const step = progress < 70 ? 'S3 업로드' : '완료 처리';
        const text =
          progress < 70
            ? `${selectedFile.name} 파일을 업로드하고 있습니다.`
            : '업로드 완료 후 AI 처리 시작 상태를 반영하고 있습니다.';
        updateProgress(progress, step, text);
      }, 220);
    } catch (error) {
      startBtn.disabled = false;
      updateProgress(0, '업로드 실패', error.message);
    }
  }

  selectBtn.addEventListener('click', () => fileInput.click());
  startBtn.addEventListener('click', runMockUpload);

  fileInput.addEventListener('change', (event) => {
    handleFile(event.target.files?.[0] || null);
  });

  container.addEventListener('dragover', (event) => {
    event.preventDefault();
    container.classList.add('dragover');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('dragover');
  });

  container.addEventListener('drop', (event) => {
    event.preventDefault();
    container.classList.remove('dragover');
    handleFile(event.dataTransfer.files?.[0] || null);
  });

  rootElement.appendChild(container);
}
