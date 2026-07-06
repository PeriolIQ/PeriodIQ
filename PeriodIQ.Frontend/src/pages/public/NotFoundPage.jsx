import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-slate-200 p-6 selection:bg-[#3378c7] selection:text-white">
      {/* Background visual effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[128px] mix-blend-screen"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-lg text-center">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600 mb-4 tracking-tighter drop-shadow-lg">
          404
        </h1>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 uppercase tracking-wide">
          Không tìm thấy trang
        </h2>
        <p className="text-lg text-slate-400 mb-10">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên, hoặc tạm thời không thể truy cập. Hãy quay lại để tiếp tục phá vỡ giới hạn tập luyện của mình.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            to="/home" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
          >
            <Home className="w-5 h-5" />
            Về Trang Chủ
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white font-bold text-base px-8 py-4 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay Lại Lịch Sử
          </button>
        </div>
      </div>
    </div>
  );
}
