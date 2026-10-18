/* DATA SHOPKHANGBABY | Trích từ demo V40 | JS truyền thống, tải theo đúng thứ tự. */
    const ICON_PATHS = {"dashboard": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/>", "video": "<rect x=\"3\" y=\"6\" width=\"13\" height=\"12\" rx=\"2\"/><path d=\"m16 10 5-3v10l-5-3\"/>", "receipt": "<path d=\"M4 3h16v18l-4-2-4 2-4-2-4 2V3Z\"/><path d=\"M8 8h8M8 12h8M8 16h4\"/>", "chart": "<path d=\"M3 3v18h18\"/><path d=\"m7 16 4-5 3 3 6-8\"/>", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>", "shield": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z\"/><path d=\"m9 12 2 2 4-4\"/>", "plug": "<path d=\"M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0V8ZM12 17v5\"/>", "refresh": "<path d=\"M20 11a8 8 0 0 0-14.7-4.3L3 9\"/><path d=\"M3 4v5h5\"/><path d=\"M4 13a8 8 0 0 0 14.7 4.3L21 15\"/><path d=\"M21 20v-5h-5\"/>", "logout": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><path d=\"m16 17 5-5-5-5M21 12H9\"/>", "download": "<path d=\"M12 3v12m-5-5 5 5 5-5\"/><path d=\"M5 17v4h14v-4\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "pin": "<path d=\"M12 17v5M6 3h12l-2 6 2 5H6l2-5-2-6Z\"/>", "wallet": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"15\" rx=\"2\"/><path d=\"M3 9h18M16 14h2\"/>", "banknote": "<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M6 12h.01M18 12h.01\"/>", "shopping-bag": "<path d=\"M4 8h16l-1 13H5L4 8ZM9 9V6a3 3 0 0 1 6 0v3\"/>", "percent": "<path d=\"m19 5-14 14\"/><circle cx=\"7\" cy=\"7\" r=\"2\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>", "rotate": "<path d=\"M3 11a9 9 0 1 1 2.6 6.4\"/><path d=\"M3 4v7h7\"/>", "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m9 9 6 6m0-6-6 6\"/>", "check-square": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"m8 12 3 3 5-6\"/>", "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>", "target": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>", "arrow-up-right": "<path d=\"M5 19 19 5M8 5h11v11\"/>", "bar-chart": "<path d=\"M3 3v18h18\"/><path d=\"M7 17v-4m5 4V7m5 10v-7\"/>", "user": "<circle cx=\"12\" cy=\"7\" r=\"4\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/>", "settings": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42\"/>", "cloud": "<path d=\"M20 17a4 4 0 0 0-1-7.87 7 7 0 0 0-13.4 2A3 3 0 0 0 6 17h14Z\"/>", "save": "<path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z\"/><path d=\"M7 3v6h9V3M7 21v-9h10v9\"/>", "link": "<path d=\"m10 13 4-4\"/><path d=\"M8 16H7a5 5 0 0 1 0-10h4m2 12h4a5 5 0 0 0 0-10h-1\"/>", "check": "<path d=\"m5 12 5 5L20 7\"/>", "alert": "<path d=\"m11 4-9 15a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13 4a2 2 0 0 0-2 0Z\"/><path d=\"M12 9v5m0 4h.01\"/>", "lightbulb": "<path d=\"M9 18h6m-5 4h4M9 15c-2-1.5-3-3.1-3-5a6 6 0 1 1 12 0c0 1.9-1 3.5-3 5v3H9v-3Z\"/>", "chevron-left": "<path d=\"m15 18-6-6 6-6\"/>", "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18\"/>", "info": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6m0-10h.01\"/>"};
    ICON_PATHS.database = '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M12 6.5h6M12 17.5h6"/>';
    ICON_PATHS.calendar = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>';
    ICON_PATHS.trend = '<path d="m3 17 6-6 4 4 7-8"/><path d="M14 7h6v6"/>';
    ICON_PATHS.layers = '<path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>';
    ICON_PATHS.filter = '<path d="M4 5h16l-6 7v6l-4 1v-7L4 5Z"/>';
    function icon(name, klass=''){
      const body = ICON_PATHS[name] || ICON_PATHS.info;
      return `<svg class="ui-icon ${klass}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
    }

    const OFFICIAL_CHANNELS = Object.freeze(['Mẹ Khang Sữa','ShopKhangBaby']);
    const HOSTS = ['Thảo My','Dung','Tâm'];
    const PAIRS = {
      'Thảo My':'Hùng Bắc Giang',
      'Dung':'Hùng Hiền Hòa',
      'Tâm':'Hùng Hiền Hòa'
    };
    const TITLE_MAP = {
      overview:'Tổng quan hệ thống',
      leaders:'Top Nhà sáng tạo / Kênh bán chạy',
      lives:'Danh sách phiên LIVE đã kết thúc',
      affiliate:'LIVE Affiliate – Đối tác bán hàng',
      orders:'Đối soát đơn hàng sau LIVE',
      ads:'Phân tích chiến dịch quảng cáo',
      kpi:'KPI Host & vận hành',
      team:'Phân quyền tài khoản',
      connect:'Kết nối nguồn dữ liệu',
      storage:'Dọn dẹp và quản lý bộ nhớ'
    };

    const baseLives = [
      {id:'7697565117730999048', title:'Live Daily', start:'16:24 17/10/2026', duration:'3h9min', hours:3.15, gross:7500000, refund:220000, orders:15, canceled:1, status:'Đang theo dõi', host:'Thảo My', channel:'ShopKhangBaby'},
      {id:'7697465608271203090', title:'Live Daily', start:'09:58 17/10/2026', duration:'6h0min', hours:6.0, gross:36700000, refund:1250000, orders:52, canceled:2, status:'Tạm đối soát', host:'Dung', channel:'ShopKhangBaby'},
      {id:'7697421468795161352', title:'Live Daily', start:'07:07 17/10/2026', duration:'2h50min', hours:2.83, gross:15000000, refund:420000, orders:22, canceled:1, status:'Tạm đối soát', host:'Tâm', channel:'Mẹ Khang Sữa'},
      {id:'7697192156787706642', title:'Deal hời ngày 16/10', start:'16:17 16/10/2026', duration:'6h5min', hours:6.08, gross:45700000, refund:1680000, orders:61, canceled:3, status:'Tiếp tục cập nhật', host:'Thảo My', channel:'ShopKhangBaby'},
      {id:'7697128051830754055', title:'Deal hời ngày 16/10', start:'12:08 16/10/2026', duration:'3h50min', hours:3.83, gross:21000000, refund:820000, orders:30, canceled:1, status:'Tiếp tục cập nhật', host:'Dung', channel:'Mẹ Khang Sữa'},
      {id:'7697045328712764167', title:'Deal hời ngày 16/10', start:'06:48 16/10/2026', duration:'4h32min', hours:4.53, gross:34400000, refund:1430000, orders:93, canceled:4, status:'Tạm đối soát', host:'Tâm', channel:'Mẹ Khang Sữa'},
      {id:'7696815828506921734', title:'Siêu Deal HIKID', start:'15:57 15/10/2026', duration:'8h5min', hours:8.08, gross:123900000, refund:4280000, orders:192, canceled:7, status:'Đã chốt tạm', host:'Thảo My', channel:'ShopKhangBaby'},
      {id:'7696750035085220616', title:'Siêu Deal HIKID', start:'11:29 15/10/2026', duration:'7h42min', hours:7.7, gross:113200000, refund:3850000, orders:406, canceled:15, status:'Đã chốt tạm', host:'Dung', channel:'Mẹ Khang Sữa'}
    ];

    // BẢN DEMO: các đối tác bên dưới là dữ liệu giả lập, không phải tài khoản thực của shop.
    // Dữ liệu Affiliate không được tính vào doanh số hoặc KPI của hai kênh LIVE chính thức.
    const demoAffiliateLives = [
      {id:'DEMO-AFF-001',creator:'Đối tác Affiliate A',handle:'@affiliate_demo_a',title:'Giới thiệu sản phẩm chăm sóc bé',date:'17/10/2026',start:'14:10 17/10/2026',duration:'2 giờ 15 phút',gross:18600000,refund:810000,orders:72,returned:3,products:6,status:'Chờ đối soát'},
      {id:'DEMO-AFF-002',creator:'Đối tác Affiliate B',handle:'@affiliate_demo_b',title:'Mẹ và bé – sản phẩm nổi bật',date:'17/10/2026',start:'09:30 17/10/2026',duration:'3 giờ 5 phút',gross:24500000,refund:1350000,orders:95,returned:5,products:9,status:'Đang theo dõi'},
      {id:'DEMO-AFF-003',creator:'Đối tác Affiliate C',handle:'@affiliate_demo_c',title:'Ưu đãi đồ dùng gia đình',date:'16/10/2026',start:'19:05 16/10/2026',duration:'1 giờ 50 phút',gross:9600000,refund:320000,orders:37,returned:2,products:4,status:'Chờ đối soát'},
      {id:'DEMO-AFF-004',creator:'Đối tác Affiliate D',handle:'@affiliate_demo_d',title:'Phiên giới thiệu sản phẩm',date:'16/10/2026',start:'11:25 16/10/2026',duration:'4 giờ 20 phút',gross:35200000,refund:1850000,orders:131,returned:7,products:11,status:'Đang theo dõi'},
      {id:'DEMO-AFF-005',creator:'Đối tác Affiliate A',handle:'@affiliate_demo_a',title:'Livestream tối 15/10',date:'15/10/2026',start:'20:15 15/10/2026',duration:'2 giờ 40 phút',gross:12300000,refund:450000,orders:50,returned:2,products:5,status:'Theo dõi hoàn trả'},
      {id:'DEMO-AFF-006',creator:'Đối tác Affiliate E',handle:'@affiliate_demo_e',title:'Khám phá sản phẩm mới',date:'15/10/2026',start:'08:10 15/10/2026',duration:'3 giờ 30 phút',gross:28100000,refund:1240000,orders:106,returned:4,products:7,status:'Chờ đối soát'}
    ];

    let state = {
      currentTab:'overview',
      role:'Admin',
      signedIn:true,
      search:'',
      hostFilter:'all',
      channelFilter:'all',
      affiliateDate:'all',
      affiliateStart:'',
      affiliateEnd:'',
      affiliateSearch:'',
      affiliatePage:1,
      affiliateSortField:'',
      affiliateSortDirection:'',
      statusFilter:'all',
      dateFilter:'30',
      dateStart:'',
      dateEnd:'',
      leaderScope:'all',
      leaderSort:'net',
      leaderDetailSortField:'',
      leaderDetailSortDirection:'',
      orderSortField:'',
      orderSortDirection:'',
      livePage:1,
      liveSortField:'',
      liveSortDirection:'',
      liveData:[],
      integrationTab:'shop',
      autoEnabled:true,
      autoMinutes:15,
      lastDemoSync:null,
      lastManualSync:null,
      syncHistory:[],
      storageConfig:null,
      storageSample:null,
      members:[],
      previewMemberId:null,
      profile:{displayName:'ShopKhangBaby',email:'shopkhangbaby@gmail.com',photoURL:'',uid:'',emailVerified:false,provider:'demo'}
    };
