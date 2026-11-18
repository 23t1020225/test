# Thiệp 19/11 — Chỉ riêng anh

Trang sử dụng HTML, CSS và JavaScript thuần, chạy bằng các tệp có sẵn trong thư mục.

## Mở trang

Nhấp đúp index.html và mở bằng trình duyệt. Nếu đang xem bản cũ, nhấn Ctrl+F5 để tải lại các tệp mới.

## Trải nghiệm

1. Chạm dấu trái tim hoặc nút Mở thư của em: phong bì mở nắp, giấy thư trượt lên.
2. Lời chúc xuất hiện từng ký tự. Có nút Hiện hết thư nếu muốn đọc ngay.
3. Bấm Xem chuyện của tụi mình để xem chồng ảnh Polaroid. Vuốt ngang, dùng nút mũi tên, các chấm chọn ảnh hoặc phím trái/phải để lật ảnh.
4. Chạm ảnh chính để xem toàn bộ ảnh lớn; đóng bằng nút X hoặc phím Esc.
5. Xem tới ảnh 6 để mở lời hẹn, sau đó bấm Nhận quà của anh.
6. Dùng nút Mở lại hoặc Đọc lại từ đầu để chơi lại.

## Chỉnh nội dung

- index.html: lời chúc nằm trong các đoạn có thuộc tính data-type. Nội dung ảnh và vé hẹn hò cũng sửa tại đây.
- style.css: thay các biến --paper, --wine và --ink ở đầu tệp để đổi màu. Có bố cục riêng cho điện thoại.
- script.js: xử lý phong bì, tốc độ gõ chữ, vuốt ảnh và món quà. Tốc độ chữ thường là 26 ms mỗi ký tự; phong bì mở trong 1450 ms.
- assets/01.png đến assets/06.png: ảnh của hai bạn. Giữ nguyên tên ảnh nếu thay ảnh.

Trang tôn trọng tùy chọn giảm chuyển động của thiết bị: khi bật chế độ đó, thư được hiện đầy đủ ngay.

Muốn gửi dưới dạng đường link, đưa toàn bộ thư mục lên dịch vụ lưu trữ web tĩnh.

## Phông chữ trong lá thư

Phần thư chạy chữ dùng Dancing Script, gồm hai độ đậm 500 và 600. Các tệp phông được lưu trong assets/fonts nên không cần tải từ Internet khi mở trang. Giấy phép SIL Open Font License nằm trong assets/fonts/OFL.txt.

Khung xem ảnh lớn tự điều chỉnh theo tỉ lệ từng ảnh và chiều cao màn hình; ảnh được hiển thị trọn vẹn, không bị cắt để lấp đầy khung.

## Nhạc nền

Nhạc không lời tự soạn theo kiểu piano và hộp nhạc, dài khoảng 47 giây và phát lặp. Tệp nằm tại assets/music/nhac-cho-anh.wav. Nhạc bắt đầu khi người xem bấm mở thư. Biểu tượng nốt nhạc ở thanh đầu trang và trong khung xem ảnh dùng để bật/tắt; chạm hoặc rê vào biểu tượng trên thanh đầu trang để chỉnh âm lượng. Âm lượng mặc định là 32%.
