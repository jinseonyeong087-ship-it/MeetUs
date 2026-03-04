// 워크스페이스 생성 모달 및 개인 음성 업로드 기능을 위한 공통 유틸리티

// 워크스페이스 생성 모달 관리
export function initWorkspaceModal() {
  const modal = document.getElementById('workspace-modal');
  const createBtn = document.getElementById('create-workspace-btn');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-modal');
  const form = document.getElementById('workspace-form');
  const nameInput = document.getElementById('workspace-name-input');
  const descriptionInput = document.getElementById('workspace-description-input');
  const errorEl = document.getElementById('workspace-error');

  if (!modal || !createBtn) return;

  // 모달 열기
  createBtn.addEventListener('click', () => {
    modal.classList.add('active');
    nameInput.focus();
    errorEl.textContent = '';
  });

  // 모달 닫기
  function closeModal() {
    modal.classList.remove('active');
    form.reset();
    errorEl.textContent = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  // 배경 클릭시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // 폼 제출
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!name) {
      errorEl.textContent = '워크스페이스 이름을 입력해주세요.';
      return;
    }

    try {
      // Mock workspace creation
      const newWorkspace = {
        id: `ws-${Date.now()}`,
        name: name,
        description: description || '',
        type: 'TEAM',
        role: 'Admin',
        members: 1,
        created_at: new Date().toISOString()
      };

      // 로컬스토리지에 저장
      const workspaces = JSON.parse(localStorage.getItem('meetus-mock-workspaces') || '[]');
      workspaces.push(newWorkspace);
      localStorage.setItem('meetus-mock-workspaces', JSON.stringify(workspaces));

      // 디버깅용 로그
      console.log('Workspace created:', newWorkspace);
      console.log('Total workspaces:', workspaces.length);

      closeModal();
      
      // 페이지 새로고침 또는 워크스페이스 리스트 업데이트
      if (typeof window.refreshWorkspaceList === 'function') {
        window.refreshWorkspaceList();
      } else {
        location.reload();
      }
      
    } catch (error) {
      errorEl.textContent = '워크스페이스 생성 중 오류가 발생했습니다.';
      console.error('Workspace creation error:', error);
    }
  });
}

// 개인 음성 업로드 기능
export function initPersonalUpload() {
  const uploadZone = document.getElementById('personal-upload-zone');
  const fileInput = document.getElementById('personal-audio-input');

  if (!uploadZone || !fileInput) return;

  // 클릭으로 파일 선택
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // 파일 선택 처리
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePersonalAudioUpload(file);
    }
  });

  // 드래그 앤 드롭 처리
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.m4a')) {
        handlePersonalAudioUpload(file);
      } else {
        alert('m4a 파일만 업로드 가능합니다.');
      }
    }
  });
}

// 개인 음성 파일 업로드 處리
function handlePersonalAudioUpload(file) {
  if (!file.name.endsWith('.m4a')) {
    alert('m4a 파일만 업로드 가능합니다.');
    return;
  }

  if (file.size > 30 * 1024 * 1024) { // 30MB
    alert('파일 크기는 30MB 이하여야 합니다.');
    return;
  }

  // 개인 보관함 워크스페이스 가져오기
  const session = JSON.parse(localStorage.getItem('meetus-mock-session') || '{}');
  const personalWorkspaceId = `personal-${session.user?.id || 'default'}`;

  // Mock meeting 생성
  const meeting = {
    id: `mtg-personal-${Date.now()}`,
    title: `개인 음성 - ${file.name.replace('.m4a', '')}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    workspace_id: personalWorkspaceId,
    status: 'UPLOADED',
    file_name: file.name,
    file_size: file.size,
    created_at: new Date().toISOString(),
    participants: [session.user?.name || '사용자'],
    summary: '',
    decisions: [],
    transcript: '',
    todos: []
  };

  // 로컬스토리지에 저장
  const meetings = JSON.parse(localStorage.getItem('meetus-mock-meetings') || '[]');
  meetings.unshift(meeting);
  localStorage.setItem('meetus-mock-meetings', JSON.stringify(meetings));

  // 디버깅용 로그
  console.log('Personal upload saved:', meeting);
  console.log('Total meetings:', meetings.length);

  alert(`${file.name}이 개인 보관함에 업로드되었습니다.`);

  // 개인 보관함으로 이동할지 사용자에게 물어보기
  const goToPersonal = confirm('개인 보관함으로 이동하시겠습니까?');
  if (goToPersonal) {
    // 개인 워크스페이스 설정 후 Archive로 이동
    const personalWorkspace = {
      id: personalWorkspaceId,
      name: `${session.user?.name || '사용자'}의 개인 보관함`,
      type: 'PERSONAL',
      role: 'Owner'
    };
    localStorage.setItem('meetus-current-workspace', JSON.stringify(personalWorkspace));
    window.location.href = './index.html';
  }
}

// 헤더 사용자 정보 업데이트
export function updateHeaderUserInfo() {
  const session = JSON.parse(localStorage.getItem('meetus-mock-session') || '{}');
  const headerUserNameEl = document.querySelector('.header-user span');

  if (headerUserNameEl && session.user) {
    headerUserNameEl.textContent = session.user.name;
  }
}

// 전역 검색 기능
export function initGlobalSearch() {
  const searchInput = document.getElementById('global-search');
  
  if (!searchInput) return;

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        // 검색 결과 페이지로 이동 (현재는 Archive 페이지로)
        window.location.href = `./index.html?search=${encodeURIComponent(query)}`;
      }
    }
  });
}