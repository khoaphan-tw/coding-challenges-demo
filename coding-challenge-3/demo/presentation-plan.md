## 1. Cấu trúc presentation: 5 phần, 11 phút

**Total presentation**

# 11 phút

Trong giới hạn 10–15 phút

| Thời gian | Phần | Thời lượng |
| --- | --- | --- |
| 0:00–1:00 | Problem recap | 1 phút |
| 1:00–2:00 | Core ride demo | 1 phút |
| 2:00–3:00 | AC & test evidence | 1 phút |
| 3:00–6:00 | k6 load demo — main highlight | 3 phút |
| 6:00–9:00 | Design decisions & trade-offs | 3 phút |
| 9:00–11:00 | Lessons learned | 2 phút |

Phân bổ bám theo hướng dẫn chính thức: 1 phút problem, 5 phút demo/code walkthrough, 3 phút decisions và 2 phút lessons. 
GitHub

Ở đây, core ride demo + test evidence + k6 demo cùng nằm trong phần live demo 5 phút.

## 2. Cách thực hiện từng phần

### Phần 1 — Problem recap (1 phút)

**Làm gì:** Giới thiệu bài toán Ride Hailing Dispatch, ba yêu cầu khó nhất: nearest matching, lifecycle và concurrency.

**Thực hiện:** Chiếu một slide gồm rider, các driver và dispatch flow. Chỉ mô tả bài toán, không đi sâu công nghệ.

**Thông điệp:** Việc tìm tài xế gần nhất tương đối đơn giản; giữ trạng thái đúng khi nhiều request và event chạy đồng thời mới là thử thách đáng chú ý.

### Phần 2 — Core ride demo (1 phút)

**Làm gì:** Show một flow minh họa nhiều AC: Create ride → nearest driver → reject → rematch → accept → complete.

**Thực hiện:** Dùng `make demo` hoặc những đoạn lệnh đã tách và rehearsal từ `scripts/demo.sh`. Ưu tiên hiển thị kết quả trạng thái thay vì toàn bộ JSON.

**Thông điệp:** Một flow có thể chứng minh nhiều hành vi cơ bản, nhưng không cần live-demo lần lượt tất cả AC.

**Điều kiện:** Phải xác nhận script có thể hoàn thành flow này trong một phút. Nếu không, dùng recording ngắn.

### Phần 3 — Acceptance criteria & tests (1 phút)

**Làm gì:** Chứng minh team có automated tests cho các acceptance criteria, bao gồm các trường hợp khó thấy bằng live demo như idempotency và concurrent assignment.

**Thực hiện:** Chiếu một bảng mapping AC → test case → kết quả. Dùng output của test suite vừa chạy trước buổi demo, không nhất thiết chạy cả suite trực tiếp trên sân khấu.

**Thông điệp:** “We won't demonstrate every acceptance criterion live, but we have mapped them to automated tests and can show the evidence.”

**Lưu ý:** Không tuyên bố 100% passing nếu test run thực tế chưa xác nhận.

### Phần 4 — k6 load/performance demo (3 phút)

**Main highlight**

**Làm gì:** Victor trình diễn k6 tạo tải lên hệ thống và cho khán giả thấy kết quả đo, khả năng xử lý concurrent workloads, cũng như giới hạn thực tế.

**Thực hiện:**

1. Giới thiệu workload: số virtual users, request rate/iterations, duration và API được test.
2. Chạy k6 profile ngắn đã rehearsal hoặc hiển thị kết quả của run dài đã hoàn tất.
3. Hiển thị throughput, latency p95, request failures và checks/thresholds.
4. Nếu có dashboard, đối chiếu kết quả k6 với các tín hiệu hệ thống như CPU, error rate hoặc service latency.
5. Kết luận điều gì đã được chứng minh và điều gì chưa thể kết luận.

**Thông điệp:** Không chỉ chứng minh happy path mà còn cho thấy behavior under load bằng số liệu thực nghiệm.

**Điểm cần xác minh:** Hiện báo cáo exploration chưa mô tả k6 scripts, thresholds hoặc kết quả benchmark của Victor, nên chưa thể chốt lệnh chạy và số liệu trình bày.

### Phần 5 — Architecture, trade-offs & lessons (5 phút)

**Làm gì:** Dùng 3 phút giải thích architecture, rồi 2 phút nói về lessons learned.

**Thực hiện:** Chiếu một sơ đồ Ride Service, Dispatch Service, Driver Service, Redpanda, Redis GEO và PostgreSQL. Nhấn mạnh Postgres atomic reservation, SAGA compensation, outbox/inbox và eventual consistency.

Trong lessons, đề cập lý do team thử microservices, những gì học được khi xây distributed workflow và các hạn chế chưa giải quyết như recovery edge cases, ordering, broker failure testing.

**Thông điệp:** Team không chỉ sử dụng nhiều công nghệ mà còn hiểu lý do lựa chọn và chi phí đi kèm.

## 3. Các scenario cần chuẩn bị

Mình đề xuất chia thành 3 nhóm, không cần mang tất cả lên sân khấu.

| Nhóm | Scenario | Cách trình bày |
| --- | --- | --- |
| Core | Ride → nearest → reject → rematch → accept → complete | Live hoặc video 60 giây |
| Tests | Matching, lifecycle, idempotency, concurrency, event handling | Một slide coverage matrix với kết quả verified |
| k6 — chính | Workload baseline, high load, metrics và bottleneck | Trình diễn kết quả thực tế trong 3 phút |
| Backup | Timeout, duplicate requests, concurrent rides, trace | Chỉ dùng nếu cần hoặc khi Q&A |

Đặc biệt với phần k6, nên phân biệt load testing với horizontal scaling. k6 có thể chứng minh API xử lý workload như thế nào; không tự chứng minh hệ thống auto-scale hay đáp ứng 1 triệu drivers. Nếu Victor đã có benchmark nhiều mức tải, hãy thể hiện kết quả so sánh bằng số liệu.
