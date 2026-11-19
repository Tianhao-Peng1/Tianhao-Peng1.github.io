(() => {
  const dialog = document.getElementById('demo-dialog');
  if (!dialog) return;
  const video = dialog.querySelector('video');
  const title = document.getElementById('demo-dialog-title');
  const description = document.getElementById('demo-dialog-description');
  const status = document.getElementById('demo-status');
  const error = document.getElementById('demo-error');
  const fileLink = document.getElementById('demo-file-link');
  const currentTitle = document.getElementById('demo-current-title');
  const playlist = document.getElementById('demo-playlist');
  const groups = {
    robotics: [
      {
        title: '双臂操作：物体抓取与放置', duration: '00:22',
        src: 'assets/videos/dual-arm-manipulation.mp4',
        poster: 'assets/platforms/dual-arm-manipulation.webp',
        summary: '桌面物体抓取、转移与放置。',
        description: '同一双臂机器人平台的三段实物操作演示，展示桌面物体的抓取、转移与放置过程。'
      },
      {
        title: '协同导航：多机器人路径规划', duration: '00:30',
        src: 'assets/videos/multi-robot-navigation.mp4',
        summary: '栅格、Gazebo 仿真与实车验证。',
        description: '展示 128 智能体栅格仿真、Gazebo 仿真与实车实验中的多机器人路径规划，验证障碍环境下的协同导航。'
      },
      {
        title: '自主探索：环境感知与建图', duration: '02:08',
        src: 'assets/videos/robot-exploration.mp4',
        poster: 'assets/platforms/robot-exploration.webp',
        figure: 'robot-exploration',
        summary: '教学楼实测及多场景探索对比。',
        description: '展示机器人在教学楼内探索和逐步建图的过程，并呈现室内、森林与仓库场景中的探索方法对比。'
      },
      {
        title: '四足运动：全身控制与抗扰动', duration: '02:01',
        src: 'assets/videos/quadruped-control.mp4?v=20261120-media',
        poster: 'assets/platforms/quadruped-control.webp',
        figure: 'quadruped-control',
        summary: '步态、姿态切换、扰动与复杂地形。',
        description: '展示四足机器人全身控制仿真与实物实验，包括正常及侧向行走、俯仰姿态切换、外部扰动和草地坡面行走。'
      }
    ]
  };
  let opener;
  let currentDemo;
  let loadId = 0;

  const localizedPoster = demo => window.AdmireI18n?.figureSource(demo.poster, demo.figure, 'en') ?? demo.poster;

  const playDemo = demo => {
    const requestId = ++loadId;
    currentDemo = demo;
    video.pause();
    currentTitle.textContent = demo.title;
    description.textContent = demo.description;
    video.setAttribute('aria-label', demo.title);
    if (demo.poster) video.poster = localizedPoster(demo);
    else video.removeAttribute('poster');
    fileLink.href = demo.src;
    status.hidden = false;
    error.hidden = true;
    // Only the selected video is loaded, including when switching the playlist.
    video.src = demo.src;
    video.load();
    video.play().catch(() => {
      if (requestId === loadId) status.hidden = true;
    });
  };

  const buildPlaylist = demos => {
    const list = document.createElement('ol');
    list.className = 'demo-playlist-list';
    demos.forEach((demo, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'demo-choice';
      button.setAttribute('aria-pressed', String(index === 0));
      if (demo.poster) {
        const thumbnail = document.createElement('img');
        thumbnail.src = localizedPoster(demo);
        if (demo.figure) {
          thumbnail.dataset.localizedFigure = demo.figure;
          thumbnail.dataset.figureOriginalLanguage = 'en';
          thumbnail.dataset.figureOriginal = demo.poster;
        }
        thumbnail.alt = '';
        thumbnail.width = 96;
        thumbnail.height = 54;
        button.append(thumbnail);
      }
      const copy = document.createElement('span');
      copy.className = 'demo-choice-copy';
      for (const [className, text] of [['demo-choice-title', demo.title], ['demo-choice-summary', demo.summary], ['demo-choice-duration', demo.duration]]) {
        const line = document.createElement('span');
        line.className = className;
        line.textContent = text;
        copy.append(line);
      }
      button.append(copy);
      button.addEventListener('click', () => {
        if (button.getAttribute('aria-pressed') === 'true') return;
        list.querySelectorAll('button').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
        playDemo(demo);
        if (window.matchMedia('(max-width: 680px)').matches) dialog.scrollTop = 0;
      });
      item.append(button);
      list.append(item);
    });
    playlist.replaceChildren(list);
  };

  document.querySelectorAll('[data-demo-src], [data-demo-group]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      title.textContent = button.dataset.demoTitle;
      const demos = groups[button.dataset.demoGroup];
      dialog.classList.toggle('has-playlist', Boolean(demos));
      playlist.hidden = !demos;
      currentTitle.hidden = !demos;
      if (demos) buildPlaylist(demos);
      else playlist.replaceChildren();
      dialog.showModal();
      playDemo(demos ? demos[0] : {
        title: button.dataset.demoTitle,
        description: button.dataset.demoDescription,
        poster: button.querySelector('.demo-poster').src,
        src: button.dataset.demoSrc
      });
      dialog.scrollTop = 0;
    });
  });

  video.addEventListener('loadeddata', () => { status.hidden = true; });
  document.addEventListener('admire:languagechange', () => {
    if (dialog.open && currentDemo?.figure) video.poster = localizedPoster(currentDemo);
  });
  video.addEventListener('error', () => {
    if (!dialog.open || !video.hasAttribute('src')) return;
    status.hidden = true;
    error.hidden = false;
  });
  dialog.querySelector('.demo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    loadId++;
    currentDemo = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    status.hidden = true;
    error.hidden = true;
    opener?.focus({preventScroll:true});
  });
})();
