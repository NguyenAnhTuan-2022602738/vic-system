import axios from 'axios';

async function testAssistant() {
  console.log('🧪 Bắt đầu kiểm tra hệ thống AI Assistant...');
  
  const payload = {
    message: "Tại sao Robot khuyên tôi nên MUA cổ phiếu VIC?",
    context: "Symbol: VIC, Price: 47,800, Recommendation: BUY"
  };

  try {
    console.log('📡 Đang gửi yêu cầu tới Web Backend (Port 3000)...');
    const response = await axios.post('http://localhost:3000/api/v1/assistant/chat', payload);

    console.log('✅ Hệ thống phản hồi thành công!');
    console.log('🤖 VIC AI Co-Pilot trả lời:');
    console.log('--------------------------------------------------');
    console.log(response.data.answer);
    console.log('--------------------------------------------------');
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Lỗi API (${error.response.status}):`, error.response.data);
      if (error.response.status === 500) {
        console.log('💡 Gợi ý: Có thể AI Service (Port 8000) chưa được bật hoặc gặp lỗi nội bộ.');
      }
    } else {
      console.error('❌ Không thể kết nối tới Server:', error.message);
      console.log('💡 Gợi ý: Hãy đảm bảo anh đã chạy lệnh `npm run dev` ở web-backend.');
    }
  }
}

testAssistant();
