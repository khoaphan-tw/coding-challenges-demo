# Sổ tay Q&A Challenge 3 — bản tổng hợp cuối

**Dành cho KVP • tiếng Việt • chuẩn bị cho buổi dự kiến 04/11/2026.** Bao gồm 48 tình huống hỏi bốn team khác và 24 tình huống KVP có thể nhận. Mỗi tình huống có một câu mở đầu và ba câu hỏi tiếp: tổng cộng 72 tình huống, 288 câu mở đầu/follow-up để chọn, không phải để hỏi hết.

**Tinh thần:** cùng hiểu giải pháp, cùng thử giả lập và tìm thêm góc nhìn. Không có một đáp án kiến trúc duy nhất. Một câu trả lời tốt có thể là “scope hiện tại chưa làm; đây là giới hạn và hướng tiếp theo”. Với hành vi bắt buộc trong AC, vẫn cần phân biệt trade-off thiết kế với chưa đáp ứng yêu cầu.

**Phạm vi:** Thien #18, Jessica #19, KVP #20, Grace #21, Light #22; bỏ James #23 theo yêu cầu. Dùng cùng snapshot đã đọc ngày 03/11/2026; không phải cập nhật mới hay đánh giá điểm số của PR. Các giả lập như một triệu tài xế, hai replica, app mất mạng, sự kiện đông khách là dữ kiện để thảo luận, không phải khẳng định team đã triển khai chúng.

## Cách dùng khi đang Q&A

- **Hỏi team khác:** chọn một bối cảnh phù hợp phần họ vừa demo; chỉ đọc câu mở đầu. Để họ giải thích rồi chọn một nhánh, không đọc cả bốn câu liên tục.
- **Câu trả lời đã rõ:** dùng nhánh “thử thêm một biến thể” để khám phá giới hạn hoặc test.
- **Họ cần thời gian:** dùng hint để đưa ra hai hướng cùng bàn, không dùng hint như đáp án mẫu áp đặt.
- **Có khác biệt ý kiến:** hỏi điều kiện/ưu tiên nào khiến lựa chọn của họ hợp lý; dùng ưu/nhược điểm để so sánh.
- **Chuẩn bị KVP:** đọc tình huống, trả lời miệng 45–60 giây, rồi mới mở phần trả lời và bằng chứng; nói thêm giới hạn nếu bị hỏi tiếp.

**Nhãn:** B = nghiệp vụ riêng; T = kỹ thuật riêng; BT = từ tác động nghiệp vụ dẫn sang cơ chế kỹ thuật. Mục “Phạm vi” chỉ rõ AC liên quan hoặc phần mở rộng. Ý tưởng tương lai không được dùng để bắt team phải hoàn thành ngoài đề.

**Cách nối chuyện:** “Mình hiểu team đang ưu tiên X. Mình thử thêm tình huống Y nhé…” → “Nếu ưu tiên đổi thành Z thì team sẽ đổi lựa chọn ở đâu?” → “Mình thấy hướng A có lợi này nhưng trả giá kia; team đánh giá thế nào?”

## Tra nhanh theo điều đang được thảo luận

| Chủ đề / dấu hiệu | Hỏi team khác | KVP chuẩn bị |
|---|---|---|
| Tài xế nghỉ ca / offline | T1, L9 | K2, K6 |
| Không còn xe / khách chờ | T8, J5, G7 | K18 |
| Fairness / khách nào được phục vụ | T7, J11, G8 | K3, K16; xem câu hỏi chung phía dưới |
| Nearest khác ETA | T3, J11 | K17 |
| Hủy hoặc nhận sát nhau | T4, T11, J6, G4, L1 | K4, K5, K6 |
| Retry / mất response / key | J3, G1, G5, L3, L11 | K7, K8, K19 |
| Hai ride / hai worker / DB race | T5, J2, L4, L8, L10 | K2, K13, K22 |
| State nhiều bước / failure recovery | J4, J9, J10, G2, L2, L6 | K8, K10, K11, K12 |
| Vị trí cũ / clock / GPS | T3, G4, L7 | K4, K9, K16, K20 |
| Scale / cache / throughput | T2, T9, T10, G3, G9, L8 | K10, K13, K14, K21, K23 |
| Logs / support / giải thích với client | T4, J7, G6, L11, L12 | K5, K15, K18 |
| Architecture / bước làm tiếp | T6, T12, J9, G11 | K1, K14, K24 |
| Test / chứng minh / regression | T5, J2, J12, G10 | K4, K22 |

**Nếu chỉ có một lượt mỗi team:** T7 (business fairness), J5 (khách chờ khi có xe mới), G1 (timeout chưa biết kết quả), L11 (ý nghĩa 202). Nếu phần demo đã giải thích những câu đó, đổi sang câu khác trong bảng. Không cần cố chọn câu về gap để có một cuộc trao đổi có giá trị.

## Chuỗi giả lập chung có thể dùng với bất kỳ team nào

Không mặc định họ đã làm phần mở rộng; hãy nói “mình cùng giả sử”.

| Bước giả lập | Câu mở đầu | Câu hỏi tiếp nếu còn thời gian |
|---|---|---|
| Một khách, một tài xế gần | Từ request đến offer, khi nào khách có thể tin rằng đã có một xe đang được giữ cho mình? | State nào phản ánh đang chờ tài xế và state nào là đã nhận? |
| Một khách, tài xế đầu reject | Sau reject, khách tiếp tục chờ và tài xế được dùng cho chuyến khác thế nào? | Nếu chỉ còn đúng tài xế vừa reject thì ride ở đâu? |
| Hai khách, một xe | Chính sách hiện tại quyết định ai giữ xe và người còn lại thấy gì? | Nếu muốn ưu tiên người chờ lâu, thay đổi ở queue policy hay driver claim? |
| Accept, cancel và deadline gần nhau | Hãy chọn một thứ tự thực thi rồi mô tả state cuối cho hai bên. | Đảo thứ tự hai bước thì kết quả nào vẫn hợp lệ, invariant nào không được đổi? |
| Message bị giao lại | Điều gì lặp lại được và điều gì không được tạo tác dụng phụ lần hai? | Nếu ID message mới nhưng business intent cũ thì sao? |
| Khách chờ, rồi có xe online | Ai đánh thức việc tìm xe lại? | Có cần queue fairness, rate limit hoặc đánh thức theo vùng không? |
| Tải tăng hoặc lỗi tạm thời | Team chọn quan sát tín hiệu nào trước khi đổi kiến trúc? | Lựa chọn tối ưu tốc độ có làm recovery hoặc correctness khó hơn không? |

## Quy định Q&A và yêu cầu cần nhớ


Theo [README chính thức](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/e7a8c81df47be5560183f01fce1dbb18fa63125b/README.md#-deeper-discussion), Solution Q&A là thảo luận về bài nộp: cách hệ thống hoạt động, quyết định thiết kế, trade-off và khó khăn. Không dùng buổi này để hỏi reviewer về cách cho điểm. README không quy định một format câu hỏi bắt buộc, cũng không ghi thời lượng riêng cho từng câu Q&A; khung 10–15 phút thuộc phần trình bày Demo Day.

README có mục engagement: câu hỏi kỹ thuật có ý nghĩa +2/câu, tối đa +6/tháng; câu trả lời đặc biệt rõ +2. Mục này được mô tả là cộng vào Season Total, không phải mặc định cộng vào 100 điểm kỹ thuật của Challenge 3. Đừng coi hỏi nhiều hoặc hỏi khó là tự động được điểm.

Đề Challenge 3 dành 35 điểm cho AC, 20 kiến trúc, 15 distributed systems/concurrency, 15 testing, và mỗi phần scalability, observability, documentation là 5. Vì vậy, câu hỏi tốt nên nối **yêu cầu → tình huống → cơ chế bảo vệ → bằng chứng**. Kiến trúc nhiều công nghệ không bù cho AC sai. [Nguồn đề](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/e7a8c81df47be5560183f01fce1dbb18fa63125b/coding-challenge-3/coding-challenge-3.md).

### Những điểm quyết định cần nhớ

| Yêu cầu | Điểm cần kiểm tra | Tình huống dễ làm lộ vấn đề |
|---|---|---|
| AC-01, AC-08 | Cùng key/cùng nội dung trả kết quả gốc; khác nội dung phải từ chối; passenger phải tồn tại | Gửi trùng đồng thời, rồi retry sau khi chuyến đã hoàn tất |
| AC-02 | OFFERED/BUSY không được nhận offer mới hay chuyển trực tiếp OFFLINE | Tài xế bấm offline đúng lúc dispatch tạo offer |
| AC-03, AC-04 | Vị trí mới nhất; gần nhất trong 2 km mặc định; bằng khoảng cách chọn driverId nhỏ nhất theo thứ tự từ điển | Event vị trí chậm; hai tài xế cùng tọa độ; tài xế sát biên bán kính |
| AC-05, AC-07 | Reject/timeout phải nhả tài xế, xóa assignedDriverId, rematch; loại tài xế đó vĩnh viễn cho riêng chuyến này | Chỉ có D1, D1 reject rồi available lại; thử mọi đường tạo offer |
| AC-05, AC-06 | Timeout mặc định 30 giây, phải cấu hình được; terminal không mở lại | Accept đúng hạn hết giờ; timer cũ chạy sau khi tài xế nhận chuyến khác |
| AC-06 | Có state machine rõ và lưu chuyển trạng thái | Complete khi chưa accept; event cũ đến sau CANCELLED |
| AC-09 | Một tài xế tối đa một pending offer hoặc accepted ride | Hai ride khác nhau tranh D1; phải có automated concurrency test |
| AC-10 | Tạo ride → event bất đồng bộ → dispatch; giải thích duplicate và failure | Crash sau DB commit, trước publish; crash sau xử lý trước ack |
| Observability | Theo được rideId, driverId, eventId trong log | “R001 đang kẹt ở đâu?” trong một phút |
| Scale | Nêu ≥3 bottleneck, ≥3 strategy, ≥2 trade-off; nói lộ trình 1k→100k→1M | Nút thắt là location writes hay số ride? Có benchmark chưa? |

**Chỗ đề dễ đọc thiếu:** AC-05 có câu mô tả người kích hoạt cancel ở ba trạng thái trước accept, nhưng ngay sau đó có cả giải phóng BUSY khi hủy chuyến đã accept; AC-06 liệt kê rõ `DRIVER_ACCEPTED → CANCELLED`. Khi thảo luận, nên dùng toàn bộ yêu cầu và kiểm tra cả cancel sau accept, tránh kết luận chỉ được cancel trước accept.

**Phân biệt quan trọng:** OFFERED là đang giữ một offer, chưa phải BUSY. Atomic claim ngăn trùng tài xế; không tự giải quyết vị trí cũ. Retry không đồng nghĩa idempotency. Có outbox không đồng nghĩa exactly-once. Kafka key không tự bảo đảm thứ tự trước khi message tới broker.

Database/broker thật, Docker, Kubernetes, auth, payment, ETA/traffic, dashboard và production geospatial infrastructure không phải yêu cầu bắt buộc. In-memory và modular monolith đều được phép. Hỏi về scale/crash để hiểu giới hạn và hướng phát triển, không mặc định đó là lỗi AC của bài in-memory.


## Danh mục tình huống

- [Thien Nguyen — PR #18](#team-t): [T1](#t1), [T2](#t2), [T3](#t3), [T4](#t4), [T5](#t5), [T6](#t6), [T7](#t7), [T8](#t8), [T9](#t9), [T10](#t10), [T11](#t11), [T12](#t12).
- [Jessica Nguyen — PR #19](#team-j): [J1](#j1), [J2](#j2), [J3](#j3), [J4](#j4), [J5](#j5), [J6](#j6), [J7](#j7), [J8](#j8), [J9](#j9), [J10](#j10), [J11](#j11), [J12](#j12).
- [Grace Phan — PR #21](#team-g): [G1](#g1), [G2](#g2), [G3](#g3), [G4](#g4), [G5](#g5), [G6](#g6), [G7](#g7), [G8](#g8), [G9](#g9), [G10](#g10), [G11](#g11), [G12](#g12).
- [Light Nguyen — PR #22](#team-l): [L1](#l1), [L2](#l2), [L3](#l3), [L4](#l4), [L5](#l5), [L6](#l6), [L7](#l7), [L8](#l8), [L9](#l9), [L10](#l10), [L11](#l11), [L12](#l12).
- [KVP — PR #20](#team-k): [K1](#k1), [K2](#k2), [K3](#k3), [K4](#k4), [K5](#k5), [K6](#k6), [K7](#k7), [K8](#k8), [K9](#k9), [K10](#k10), [K11](#k11), [K12](#k12), [K13](#k13), [K14](#k14), [K15](#k15), [K16](#k16), [K17](#k17), [K18](#k18), [K19](#k19), [K20](#k20), [K21](#k21), [K22](#k22), [K23](#k23), [K24](#k24).

<a id="team-t"></a>

## Thien Nguyen — PR #18

Modular monolith Java/Spring; dispatch sở hữu claim; driver giữ bản sao assignment; PostgreSQL/Kafka; Redis làm read cache.

[PR](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/18) · [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md)

**Gợi ý chọn nhanh:** T1, T5, T7, T10. Đây là gợi ý điều hướng, không phải xếp hạng độ khó.

| Mã | Loại | Tình huống |
|---|---|---|
| [T1](#t1) | Nghiệp vụ → kỹ thuật | Tài xế kết thúc ca đúng lúc có khách |
| [T2](#t2) | Kỹ thuật | Nhiều sự kiện nhưng vẫn đúng thứ tự |
| [T3](#t3) | Nghiệp vụ → kỹ thuật | Tài xế vừa rời điểm đón |
| [T4](#t4) | Nghiệp vụ → kỹ thuật | Khách đã hủy nhưng tài xế chưa nhận chuyến mới |
| [T5](#t5) | Kỹ thuật | Cùng mô phỏng hai khách tranh một xe |
| [T6](#t6) | Kỹ thuật | Tách dispatch để một nhóm phát triển độc lập |
| [T7](#t7) | Nghiệp vụ | Hai khách cùng chờ, phục vụ ai trước? |
| [T8](#t8) | Nghiệp vụ | Không có xe trong bán kính |
| [T9](#t9) | Nghiệp vụ → kỹ thuật | Nhiều người mở app sau sự kiện |
| [T10](#t10) | Kỹ thuật | Cache đọc và màn hình sau một thao tác |
| [T11](#t11) | Nghiệp vụ | Hủy sau khi tài xế đã nhận |
| [T12](#t12) | Kỹ thuật | Thêm một rule matching mà không phá code cũ |
<a id="t1"></a>

### T1 — Tài xế kết thúc ca đúng lúc có khách

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-02, AC-09

**Bối cảnh / giả lập:** D1 sắp nghỉ ca; R1 vừa được dispatch giữ D1 nhưng màn hình tài xế chưa cập nhật.

**Câu mở đầu:** “Nếu tài xế bấm offline ngay lúc đó, team muốn trải nghiệm của tài xế và hành khách diễn ra như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Trạng thái ở module nào quyết định tài xế còn nhận chuyến được không?”
2. **Thử thêm một khía cạnh:** “Nếu hai module chưa đồng bộ, nhóm chọn chờ xác nhận hay bù lại offer?”
3. **Cùng phát triển giải pháp:** “Nếu cần bám AC-02 chặt hơn, team muốn thay đổi ranh giới quyết định ở đâu?”

**Hint nếu cần mở cuộc trao đổi:** Có thể cùng so sánh quyền quyết định tại một nơi với cho phép cập nhật cục bộ rồi xử lý bù.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Một nơi quyết định availability và claim: dễ giữ invariant ngay; đổi lại tăng coupling và chờ xử lý.
- **B.** Các module quyết định cục bộ rồi bù: độc lập và phản hồi nhanh hơn; đổi lại có cửa sổ trạng thái không thống nhất.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [DriverService.changeAvailability](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/driver/src/main/java/com/ridehailing/driver/application/DriverService.java); [SupplyUpdates](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/dispatch/src/main/java/com/ridehailing/dispatch/application/SupplyUpdates.java).

**Ghi chú nội bộ từ lần kiểm tra trước — không đọc thành lời buộc lỗi:** `changeAvailability` quyết định trên bản sao assignment; code nói rõ offline có thể thành công trong khoảng trễ, rồi dispatch expire offer. AC-02 yêu cầu OFFERED/BUSY không đi trực tiếp OFFLINE. Đây là điểm cần team giải thích, không nên mặc định cơ chế bù đã tương đương yêu cầu chặn ngay.

**Ghi chú chuẩn bị riêng:** Code cho phép availability được quyết định trên bản sao assignment; offline trong khoảng trễ có thể được bù bằng expire. Cần phân biệt eventual compensation với yêu cầu AC-02 chặn OFFERED/BUSY đi trực tiếp OFFLINE.

<a id="t2"></a>

### T2 — Nhiều sự kiện nhưng vẫn đúng thứ tự

**Loại:** Kỹ thuật · **Phạm vi:** AC-10; scalability

**Bối cảnh / giả lập:** Ứng dụng mở rộng; location events tăng trong khi chuyến vẫn cần xử lý theo thứ tự.

**Câu mở đầu:** “Team đã chọn một outbox relay publish tại một thời điểm. Điều gì khiến lựa chọn này hợp lý ở quy mô hiện tại?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Team theo dõi backlog hay thời gian từ commit đến publish bằng gì?”
2. **Thử thêm một khía cạnh:** “Nếu một batch publish chậm, ride events bị ảnh hưởng ra sao?”
3. **Cùng phát triển giải pháp:** “Khi tăng throughput, team muốn chia theo aggregate, khu vực hay đổi sang CDC?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ hai mục tiêu riêng: thứ tự mỗi đối tượng và tổng thông lượng.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Một relay có lock: dễ hiểu và giữ thứ tự publish; đổi lại có điểm nghẽn và chậm lan truyền giữa các loại event.
- **B.** Nhiều relay theo quyền sở hữu key hoặc CDC: tăng thông lượng; đổi lại phải thiết kế ordering, failover và vận hành.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [OutboxRelay](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/common/src/main/java/com/ridehailing/common/events/OutboxRelay.java); [scalability](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/docs/scalability.md).

<a id="t3"></a>

### T3 — Tài xế vừa rời điểm đón

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-03, AC-04

**Bối cảnh / giả lập:** D1 vừa cập nhật đã ra ngoài 2 km; hành khách gần vị trí cũ đặt xe ngay sau đó.

**Câu mở đầu:** “Team đang hiểu vị trí mới nhất trong matching theo mốc nào, và khách có thể thấy điều gì trong khoảng dữ liệu đang đồng bộ?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Update location đã trả thành công thì dispatch đã đọc thấy chưa?”
2. **Thử thêm một khía cạnh:** “Có cách nào đo dữ liệu đang chậm bao lâu trước khi quyết định offer không?”
3. **Cùng phát triển giải pháp:** “Nếu muốn giảm offer không phù hợp, team chọn xác minh lại ứng viên hay chờ projection bắt kịp?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách hai câu chuyện: không double-book và chọn đúng theo vị trí đủ mới.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Dùng projection: tìm nhanh, giảm coupling; đổi lại chấp nhận lag và cần freshness policy.
- **B.** Xác minh authoritative data trước khi giữ: giảm rủi ro dữ liệu cũ; đổi lại thêm call/transaction và chưa tự tạo snapshot toàn đội xe.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [supply projection](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/dispatch/src/main/java/com/ridehailing/dispatch/adapters/persistence/JdbcDriverSupplyRepository.java); [DispatchService](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/dispatch/src/main/java/com/ridehailing/dispatch/application/DispatchService.java).

<a id="t4"></a>

### T4 — Khách đã hủy nhưng tài xế chưa nhận chuyến mới

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-06, AC-10; observability

**Bối cảnh / giả lập:** Khách thấy CANCELLED, trong khi app tài xế vẫn BUSY do event release đang chậm.

**Câu mở đầu:** “Team sẽ giải thích và xử lý tình huống tài xế nói đã hủy mà chưa nhận được chuyến mới như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Màn hình nên nói đang đồng bộ hay báo lỗi ngay?”
2. **Thử thêm một khía cạnh:** “Đợi bao lâu thì xem là bất thường thay vì chậm bình thường?”
3. **Cùng phát triển giải pháp:** “Nếu event bị đưa vào DLT, bước nào giúp ca trực phục hồi đúng chuyến?”

**Hint nếu cần mở cuộc trao đổi:** Nếu khó chọn ngưỡng, có thể nói trước tín hiệu cần đo: tuổi trạng thái, lag, outbox và event cuối.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Chỉ dựa retry delivery: ít logic thêm; đổi lại event vào DLT có thể cần người xử lý.
- **B.** Thêm reconciliation theo invariant: phát hiện lệch trạng thái lâu; đổi lại phải tránh repair nhầm và thêm tải kiểm tra.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [sequence](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/docs/sequence-diagram.md); [RideOutcomes](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/modules/dispatch/src/main/java/com/ridehailing/dispatch/application/RideOutcomes.java); [README failure semantics](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md).

<a id="t5"></a>

### T5 — Cùng mô phỏng hai khách tranh một xe

**Loại:** Kỹ thuật · **Phạm vi:** AC-09; testing

**Bối cảnh / giả lập:** Chỉ còn D1 available; hai hành khách đặt hai ride khác nhau gần như cùng lúc.

**Câu mở đầu:** “Team có thể cùng mình dựng test nhỏ cho hai ride tranh D1 và giải thích điểm quyết định thắng thua không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Test làm sao cho cả hai cùng nhìn thấy một ứng viên trước khi claim?”
2. **Thử thêm một khía cạnh:** “Ngoài response, trạng thái driver, ride và offer cần thỏa điều gì?”
3. **Cùng phát triển giải pháp:** “Nếu cố tình bỏ một lớp bảo vệ, test nào nên báo lỗi?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng barrier và hậu kiểm invariant, thay vì phụ thuộc sleep đúng thời điểm.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** CAS kèm unique constraint: bảo vệ ở DB và có lớp dự phòng; đổi lại cần hiểu conflict và xử lý loser.
- **B.** Khóa ứng dụng: dễ diễn giải trong một process; đổi lại không tự bảo vệ nhiều process hoặc code path bỏ qua lock.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [AC-09 test](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/app/src/integrationTest/java/com/ridehailing/acceptance/AC09ConcurrentAssignmentAcceptanceIT.java); [README test strategy](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md).

<a id="t6"></a>

### T6 — Tách dispatch để một nhóm phát triển độc lập

**Loại:** Kỹ thuật · **Phạm vi:** Architecture; trade-off

**Bối cảnh / giả lập:** Sau challenge, một nhóm muốn deploy dispatch riêng mà không chờ ride/driver.

**Câu mở đầu:** “Ranh giới module hiện tại giúp bước tách service ở đâu, và phần nào vẫn cần thiết kế lại?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Phần transaction và shared outbox sẽ thay đổi gì?”
2. **Thử thêm một khía cạnh:** “Làm sao nâng version event mà module cũ vẫn chạy được?”
3. **Cùng phát triển giải pháp:** “Điều gì khiến team quyết định chưa tách ở quy mô nhỏ?”

**Hint nếu cần mở cuộc trao đổi:** Có thể xem đây là quyết định tổ chức và vận hành, không chỉ đổi packaging.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Giữ modular monolith: deploy và transaction đơn giản; đổi lại không scale/deploy từng module riêng.
- **B.** Tách service: nhóm tự chủ và scale riêng; đổi lại thêm contract, mạng, recovery và observability.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [ADR decoupled contexts](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/docs/adr/ADR-002-decoupled-contexts.md); [architecture](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md).

<a id="t7"></a>

### T7 — Hai khách cùng chờ, phục vụ ai trước?

**Loại:** Nghiệp vụ · **Phạm vi:** Mở rộng nghiệp vụ; không phải AC bổ sung

**Bối cảnh / giả lập:** Trong bán kính chỉ có một xe; khách A đợi 40 giây, khách B vừa tạo yêu cầu và gần xe hơn.

**Câu mở đầu:** “Nếu phát triển thành sản phẩm, team muốn ưu tiên khách chờ lâu hay ưu tiên khoảng cách gần nhất?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Đề đang yêu cầu chọn driver cho từng ride; đã có chính sách ưu tiên giữa các ride chưa?”
2. **Thử thêm một khía cạnh:** “Nếu luôn cho khách mới gần hơn, khách cũ có thể chờ mãi không?”
3. **Cùng phát triển giải pháp:** “Team muốn theo dõi chỉ số nào để biết chính sách đang gây bất công?”

**Hint nếu cần mở cuộc trao đổi:** Có thể giữ thuật toán đúng đề hôm nay rồi bàn riêng queue age như một yêu cầu sản phẩm mới.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Ưu tiên tuổi yêu cầu: dễ giải thích với khách, giảm starvation; đổi lại có thể tăng tổng quãng đường đón.
- **B.** Ưu tiên hiệu quả khoảng cách: giảm thời gian di chuyển tổng thể; đổi lại cần cơ chế chống một số khách chờ quá lâu.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="t8"></a>

### T8 — Không có xe trong bán kính

**Loại:** Nghiệp vụ · **Phạm vi:** AC-04, AC-07; mở rộng sản phẩm

**Bối cảnh / giả lập:** Một hành khách ở khu vực ít tài xế; tìm trong 2 km chưa có kết quả.

**Câu mở đầu:** “Ở phiên bản hiện tại, team muốn khách hiểu trạng thái MATCHING như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Khách nên tiếp tục chờ, chủ động hủy hay nhận gợi ý thử lại?”
2. **Thử thêm một khía cạnh:** “Nếu mở rộng radius sau một thời gian, thông tin nào cần báo lại cho khách?”
3. **Cùng phát triển giải pháp:** “Mở radius có còn đúng cấu hình/contract hiện tại không, hay phải là policy mới?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bàn trải nghiệm chờ trước, rồi mới chọn cơ chế đánh thức matching.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Giữ radius cố định: đúng contract, kết quả dễ dự đoán; đổi lại tỷ lệ không tìm được xe cao ở vùng thưa.
- **B.** Mở radius theo policy mới: tăng cơ hội có xe; đổi lại đón lâu hơn và phải thể hiện rõ thay đổi kỳ vọng.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="t9"></a>

### T9 — Nhiều người mở app sau sự kiện

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-09; scalability; giả lập tải

**Bối cảnh / giả lập:** Một sự kiện kết thúc; hàng trăm khách cùng đặt ở một địa điểm, mọi ride chọn những xe gần nhất giống nhau.

**Câu mở đầu:** “Team sẽ nhận biết đang thiếu xe thật hay đang tốn thời gian vì các ride cùng tranh một số xe như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Metric conflict rate và matching latency sẽ giúp phân biệt ra sao?”
2. **Thử thêm một khía cạnh:** “Tăng worker có thể giúp phần nào và làm contention nặng hơn ở đâu?”
3. **Cùng phát triển giải pháp:** “Nếu thử batch matching, team chấp nhận thêm chờ bao nhiêu để đổi lấy ít xung đột?”

**Hint nếu cần mở cuộc trao đổi:** Có thể so sánh greedy theo từng ride với gom một cửa sổ nhỏ, coi con số cửa sổ là giả định thử nghiệm.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Greedy từng ride: ít latency chủ động và đơn giản; đổi lại dễ tranh cùng ứng viên.
- **B.** Batch theo khu vực: phân bổ phối hợp hơn; đổi lại thêm latency, thuật toán và quy tắc công bằng.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="t10"></a>

### T10 — Cache đọc và màn hình sau một thao tác

**Loại:** Kỹ thuật · **Phạm vi:** AC-06, AC-08; caching

**Bối cảnh / giả lập:** Khách vừa cancel rồi refresh nhanh; bản đọc hoặc projection có thể chưa phản ánh trạng thái mong đợi.

**Câu mở đầu:** “Team muốn client dựa vào response của command hay GET để biết thao tác vừa được ghi nhận?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Cache có được dùng để quyết định accept/cancel không?”
2. **Thử thêm một khía cạnh:** “Nếu client cần đọc thấy ngay thao tác của mình, version hoặc response có giúp không?”
3. **Cùng phát triển giải pháp:** “Nếu Redis ngừng hoạt động, điều gì vẫn chạy và điều gì chậm hơn?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách read cache khỏi nguồn quyết định nghiệp vụ và thống nhất contract client.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Cache cho read: giảm tải polling; đổi lại cần TTL/version/invalidation và chấp nhận độ trễ.
- **B.** Đọc DB cho mọi GET: đơn giản về freshness tại DB đó; đổi lại tăng tải và vẫn không loại projection lag xuyên module.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="t11"></a>

### T11 — Hủy sau khi tài xế đã nhận

**Loại:** Nghiệp vụ · **Phạm vi:** AC-05, AC-06; phí hủy ngoài scope

**Bối cảnh / giả lập:** Khách thay đổi kế hoạch ngay sau accept; tài xế vừa thấy chuyến mới.

**Câu mở đầu:** “Với phạm vi challenge, team xử lý cancel sau accept và giải phóng tài xế như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Thông báo nào giúp hai bên hiểu đây là chuyến đã hủy?”
2. **Thử thêm một khía cạnh:** “Nếu request cancel bị gửi lại, có tạo thêm event hoặc tác dụng phụ không?”
3. **Cùng phát triển giải pháp:** “Nếu sau này có phí hủy, phần nào nên là workflow riêng thay vì ghép vào dispatch?”

**Hint nếu cần mở cuộc trao đổi:** Có thể giữ phần chấm bài ở cancel/release; phí hủy chỉ là giả định mở rộng để bàn ranh giới.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Cancel trong lifecycle hiện tại: phạm vi gọn, dễ test; đổi lại chưa xử lý phí/thông báo ngoài đề.
- **B.** Workflow riêng khi thêm phí: rõ trách nhiệm và retry; đổi lại thêm consistency và vận hành.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="t12"></a>

### T12 — Thêm một rule matching mà không phá code cũ

**Loại:** Kỹ thuật · **Phạm vi:** Architecture; mở rộng ngoài scope

**Bối cảnh / giả lập:** Một yêu cầu tương lai muốn tránh tài xế không đủ điều kiện cho một loại chuyến.

**Câu mở đầu:** “Team sẽ đặt eligibility rule ở đâu để matcher, API và test cùng dùng được?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Rule nào là lọc ứng viên, rule nào cần xác minh lại khi claim?”
2. **Thử thêm một khía cạnh:** “Làm sao tránh mỗi entry point triển khai một phiên bản khác nhau?”
3. **Cùng phát triển giải pháp:** “Team chọn unit test nào và integration test nào trước khi thêm rule?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bàn nguyên tắc đặt invariant ở nơi quyết định, chưa cần implement loại xe trong challenge.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Policy/eligibility tách rõ: dễ mở rộng và test; đổi lại thêm abstraction cần giữ đơn giản.
- **B.** Điều kiện trực tiếp trong query/use-case: ít lớp hơn; đổi lại dễ lặp rule hoặc khó đổi adapter.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/21e1dd3a29eb731d8a82327a3c1d59fef594bf8b/coding-challenge-3/thiennguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.


<a id="team-j"></a>

## Jessica Nguyen — PR #19

Modular monolith Express/TypeScript; repository, bus và timers trong memory. Lựa chọn in-memory hợp lệ theo đề.

[PR](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/19) · [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md)

**Gợi ý chọn nhanh:** J5, J3, J1, J8. Đây là gợi ý điều hướng, không phải xếp hạng độ khó.

| Mã | Loại | Tình huống |
|---|---|---|
| [J1](#j1) | Nghiệp vụ → kỹ thuật | Cùng một rule trên nhiều đường tạo offer |
| [J2](#j2) | Kỹ thuật | Từ một process sang repository bất đồng bộ |
| [J3](#j3) | Nghiệp vụ → kỹ thuật | Khách bấm lại sau mạng chập chờn |
| [J4](#j4) | Kỹ thuật | Một thao tác chạm nhiều object |
| [J5](#j5) | Nghiệp vụ | Khách đang chờ thì có tài xế online |
| [J6](#j6) | Kỹ thuật | Callback timeout đến muộn |
| [J7](#j7) | Nghiệp vụ | Dashboard nói tìm xe nhưng chưa có kết quả |
| [J8](#j8) | Nghiệp vụ | Tài xế không phản hồi vì app ở nền |
| [J9](#j9) | Kỹ thuật | Đổi in-memory sang lưu trữ bền vững |
| [J10](#j10) | Kỹ thuật | Retry lỗi kỹ thuật và hết ứng viên là hai việc khác nhau |
| [J11](#j11) | Nghiệp vụ | Hai tài xế cách đều hành khách |
| [J12](#j12) | Kỹ thuật | Chọn ba test bảo vệ bài tốt nhất |
<a id="j1"></a>

### J1 — Cùng một rule trên nhiều đường tạo offer

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-07

**Bối cảnh / giả lập:** D1 đã reject R1; nhân viên demo dùng thao tác tạo offer trực tiếp thay vì automatic dispatch.

**Câu mở đầu:** “Nếu cùng một chuyến được tạo offer bằng hai đường khác nhau, team muốn dùng chung quy tắc eligibility như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Sau reject, đường manual có cần loại D1 giống đường tự động không?”
2. **Thử thêm một khía cạnh:** “Rule nên được kiểm tra ở matcher, tạo offer hay cả hai với vai trò khác nhau?”
3. **Cùng phát triển giải pháp:** “Nếu thêm guard, team muốn test từ HTTP hay test use-case trước?”

**Hint nếu cần mở cuộc trao đổi:** Có thể cùng phân biệt shortlist cho nhanh với invariant bắt buộc tại nơi tạo offer.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Guard trong use-case tạo offer: bảo vệ mọi entry point; đổi lại phải đọc eligibility/history tại điểm ghi.
- **B.** Chỉ lọc ở matcher: luồng tự động đơn giản; đổi lại đường manual hoặc entry point mới có thể bỏ qua rule.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [routes](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/routes/rides.ts); [CreateRideOfferService](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/dispatch/create-ride-offer.ts); [DispatchRideService](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/dispatch/dispatch-ride.ts).

**Ghi chú nội bộ từ lần kiểm tra trước — không đọc thành lời buộc lỗi:** Dispatch tự động loại các tài xế từng nhận offer, nhưng `CreateRideOfferService.execute` không kiểm tra lịch sử loại trừ; route tạo offer trực tiếp gọi use-case này. Probe trên code đã build xác nhận có thể tạo PENDING offer mới cho D1 khi có lịch sử REJECTED và R1 MATCHING.

<a id="j2"></a>

### J2 — Từ một process sang repository bất đồng bộ

**Loại:** Kỹ thuật · **Phạm vi:** AC-09; testing

**Bối cảnh / giả lập:** Bài hiện dùng synchronous in-memory repository; tương lai đổi sang DB async.

**Câu mở đầu:** “Trong phạm vi một Node process, cơ chế claim hiện bảo vệ điều gì, và bước nào thay đổi khi repository có await?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Test Promise.all hiện mô phỏng được kiểu cạnh tranh nào?”
2. **Thử thêm một khía cạnh:** “Nếu cả hai worker đọc cùng candidate rồi mới ghi, guard nên nằm ở đâu?”
3. **Cùng phát triển giải pháp:** “Team có muốn dùng barrier hoặc fake trì hoãn để diễn tả interleaving đó không?”

**Hint nếu cần mở cuộc trao đổi:** Không cần mặc định single-process là kém; hãy gọi đúng phạm vi guarantee rồi bàn bước phát triển.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Synchronous in-process claim: gọn và hợp lý cho demo; đổi lại không dùng làm chứng cứ distributed concurrency.
- **B.** DB conditional update: bảo vệ nhiều process cùng DB; đổi lại cần transaction, xử lý conflict và integration test.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [test cạnh tranh](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/tests/application/dispatch-ride.test.ts); [claimForOffer](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/infrastructure/persistence/in-memory-driver-repository.ts).

<a id="j3"></a>

### J3 — Khách bấm lại sau mạng chập chờn

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-01, AC-08

**Bối cảnh / giả lập:** Khách đặt xe, chưa nhận response rồi gửi lại; client có thể serialize JSON khác thứ tự.

**Câu mở đầu:** “Với cùng ý định đặt chuyến, team muốn lần retry nhận lại kết quả gì?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu chỉ đổi thứ tự field, hệ thống coi cùng request hay khác request?”
2. **Thử thêm một khía cạnh:** “Nếu ride đã tiến sang assigned/completed, create retry trả snapshot gốc hay state hiện tại?”
3. **Cùng phát triển giải pháp:** “Team muốn client dùng GET để đọc state mới và POST để replay kết quả ra sao?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng hai khái niệm: không tạo tác dụng phụ mới và hợp đồng response khi replay.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Canonical payload và immutable snapshot: retry ổn định; đổi lại cần quy tắc normalize và lưu snapshot.
- **B.** Giữ object hiện tại: ít dữ liệu/lớp hơn; đổi lại kết quả replay đổi theo lifecycle, khó bám original-result contract.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [CreateRideService](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/rides/create-ride.ts); [reference storage](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/infrastructure/persistence/in-memory-ride-repository.ts).

**Ghi chú nội bộ từ lần kiểm tra trước — không đọc thành lời buộc lỗi:** fingerprint là `JSON.stringify(input)` và record giữ cùng object Ride đang được repository sửa. Probe xác nhận đổi thứ tự field bị conflict; retry sau progression trả DRIVER_ASSIGNED. Không tạo thêm ride, nhưng cần làm rõ yêu cầu ‘original result’ và canonicalization.

**Ghi chú chuẩn bị riêng:** Probe use-case trên code đã build xác nhận đổi thứ tự field bị conflict; record giữ reference của Ride nên replay sau progression trả state đã đổi. Đây khác nhau giữa không tạo thêm ride và trả original result.

<a id="j4"></a>

### J4 — Một thao tác chạm nhiều object

**Loại:** Kỹ thuật · **Phạm vi:** AC-05, AC-09; architecture

**Bối cảnh / giả lập:** Tạo offer cần đổi driver, ride, rồi lưu offer; giả lập adapter thứ hai ném lỗi.

**Câu mở đầu:** “Nếu một lần tạo offer dừng giữa các bước ghi, team muốn hệ thống rollback hay sửa bù như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Trạng thái nào giúp phát hiện driver bị giữ nhưng chưa có offer?”
2. **Thử thêm một khía cạnh:** “Với một DB, transaction nên bao trùm những write nào?”
3. **Cùng phát triển giải pháp:** “Với nhiều DB, điều gì khiến compensation trở nên cần thiết?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ invariant sau thất bại thay vì chọn pattern ngay.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Một transaction local: rollback rõ cho driver/ride/offer cùng DB; đổi lại ràng buộc ownership và phạm vi DB.
- **B.** Compensation nhiều owner: linh hoạt phân tách; đổi lại trạng thái trung gian, retry và reconciliation.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [thứ tự ghi](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/dispatch/create-ride-offer.ts); [known limitations](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md).

<a id="j5"></a>

### J5 — Khách đang chờ thì có tài xế online

**Loại:** Nghiệp vụ · **Phạm vi:** AC-07; wake-up tự động là mở rộng

**Bối cảnh / giả lập:** R1 chưa có xe và đang MATCHING; sau đó D2 online gần khách.

**Câu mở đầu:** “Ở demo hiện tại, điều gì giúp khách được tìm xe lại khi có người online?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Khách phải bấm retry hay hệ thống tự đánh thức chuyến?”
2. **Thử thêm một khía cạnh:** “Nếu thêm tự động, team ưu tiên ride nào khi nhiều khách cùng chờ?”
3. **Cùng phát triển giải pháp:** “Làm sao tránh mỗi location update kích hoạt quét lại tất cả ride?”

**Hint nếu cần mở cuộc trao đổi:** Có thể so sánh retry chủ động, polling có giới hạn và event theo vùng.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Manual retry: dễ làm và dễ quan sát; đổi lại khách phải thao tác và có thể bỏ lỡ xe vừa xuất hiện.
- **B.** Wake-up theo vùng kèm backoff: chủ động hơn; đổi lại cần queue policy và tránh fan-out quá lớn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [no candidate](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/dispatch/dispatch-ride.ts); [manual retry](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md).

<a id="j6"></a>

### J6 — Callback timeout đến muộn

**Loại:** Kỹ thuật · **Phạm vi:** AC-05, AC-06

**Bối cảnh / giả lập:** Offer cũ đã kết thúc; D1 phục vụ chuyến khác, nhưng timer cũ mới chạy.

**Câu mở đầu:** “Team xác định một timer còn quyền thay đổi trạng thái bằng cách nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Chỉ driverId đã đủ chưa, hay cần rideId/offerId/status?”
2. **Thử thêm một khía cạnh:** “Nếu accept và callback timeout chạy sát nhau, nhánh nào được phép ghi?”
3. **Cùng phát triển giải pháp:** “Team dùng fake clock hay timer thật để test tình huống này?”

**Hint nếu cần mở cuộc trao đổi:** Có thể xem timer như lời nhắc kiểm tra lại state, không phải mệnh lệnh chắc chắn phải release.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Timer per offer: dễ xây và nhanh cho demo; đổi lại phụ thuộc process và phải chặn callback cũ.
- **B.** Persistent deadline/sweeper: sống qua restart và quét lại được; đổi lại thêm lưu trữ, scan và độ trễ tick.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [ExpireRideOfferService](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/src/application/dispatch/expire-ride-offer.ts); [offer tests](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/tests/application/respond-to-ride-offer.test.ts).

<a id="j7"></a>

### J7 — Dashboard nói tìm xe nhưng chưa có kết quả

**Loại:** Nghiệp vụ · **Phạm vi:** AC-01, AC-05, AC-10; trải nghiệm demo

**Bối cảnh / giả lập:** Khách vừa đặt; create trả REQUESTED, background consumer chưa chạy matching.

**Câu mở đầu:** “Team muốn dashboard giúp khách hiểu những bước nào mà không lộ chi tiết nội bộ?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Khi nào hiện đang tìm tài xế, khi nào hiện đang chờ tài xế phản hồi?”
2. **Thử thêm một khía cạnh:** “Nếu lỗi kỹ thuật, thông báo nào khác với không có xe trong vùng?”
3. **Cùng phát triển giải pháp:** “Nếu người dùng refresh, có khôi phục được cùng ride từ định danh nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bàn ngôn ngữ trạng thái trước, rồi mới quyết định polling và error contract.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Ít trạng thái hiển thị: dễ hiểu; đổi lại khó phân biệt chờ bình thường với lỗi.
- **B.** Trạng thái hiển thị theo giai đoạn: rõ kỳ vọng hơn; đổi lại cần mapping nhất quán và tránh nhấp nháy khi state đổi nhanh.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="j8"></a>

### J8 — Tài xế không phản hồi vì app ở nền

**Loại:** Nghiệp vụ · **Phạm vi:** AC-05, AC-07

**Bối cảnh / giả lập:** D1 được giữ offer nhưng điện thoại mất mạng, không có accept/reject.

**Câu mở đầu:** “Vì sao timeout 30 giây là lựa chọn phù hợp trong demo, và nó ảnh hưởng khách/tài xế ra sao?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu giảm còn 10 giây, ai được lợi và ai bị thiệt?”
2. **Thử thêm một khía cạnh:** “Nếu tăng 60 giây, tài xế bị giữ chỗ và khách chờ thế nào?”
3. **Cùng phát triển giải pháp:** “Một timeout có nên được coi giống explicit reject trong lịch sử chuyến không?”

**Hint nếu cần mở cuộc trao đổi:** Đề mặc định 30 giây và xem timeout như reject; chính sách khác là giả định tương lai.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Timeout ngắn: nhả xe/rematch sớm; đổi lại dễ bỏ lỡ tài xế phản hồi chậm.
- **B.** Timeout dài: cho tài xế thêm thời gian; đổi lại khóa năng lực và kéo dài chờ khách.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="j9"></a>

### J9 — Đổi in-memory sang lưu trữ bền vững

**Loại:** Kỹ thuật · **Phạm vi:** Architecture; failure recovery; mở rộng

**Bối cảnh / giả lập:** Team muốn demo giữ được ride và offer sau restart.

**Câu mở đầu:** “Nếu chỉ được thay từng bước, team ưu tiên lưu bền vững phần nào trước?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Ride, idempotency record và event cần commit cùng nhau ở đâu?”
2. **Thử thêm một khía cạnh:** “Timer đang nằm trong memory sẽ khôi phục bằng dữ liệu gì?”
3. **Cùng phát triển giải pháp:** “Có phần nào của repository port hiện tại cần đổi sang async không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể đi từ một DB và outbox trong monolith, chưa cần tách microservices.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Một DB và outbox: giữ atomicity local, giảm crash gap; đổi lại thêm migrations và relay.
- **B.** Chỉ persist ride trước: ít việc ban đầu; đổi lại event/timer/dedup vẫn có thể mất và cần ghi rõ giới hạn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="j10"></a>

### J10 — Retry lỗi kỹ thuật và hết ứng viên là hai việc khác nhau

**Loại:** Kỹ thuật · **Phạm vi:** AC-10; observability

**Bối cảnh / giả lập:** Một event xử lý lỗi adapter, trong khi ride khác không có tài xế phù hợp.

**Câu mở đầu:** “Team muốn phân biệt hai trường hợp này trong queue và log thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Không có candidate có nên tiêu hết ba lần retry kỹ thuật không?”
2. **Thử thêm một khía cạnh:** “Sau max attempts, ai biết và thao tác nào giúp thử lại an toàn?”
3. **Cùng phát triển giải pháp:** “Nếu lỗi dữ liệu không sửa bằng retry, có nên dừng sớm hơn không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách kết quả nghiệp vụ hợp lệ khỏi lỗi hạ tầng, rồi mới chọn retry policy.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Retry hữu hạn và dead letter: tránh vòng lặp vô tận; đổi lại cần cách quan sát và phục hồi.
- **B.** Retry không giới hạn: có cơ hội tự qua lỗi tạm thời; đổi lại dễ kẹt queue và che lỗi vĩnh viễn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="j11"></a>

### J11 — Hai tài xế cách đều hành khách

**Loại:** Nghiệp vụ · **Phạm vi:** AC-04; fairness ngoài scope

**Bối cảnh / giả lập:** D-A và D-B cùng tọa độ hoặc cùng khoảng cách tính được.

**Câu mở đầu:** “Team có thể demo tie-break để cùng một input luôn cho cùng kết quả không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Vì sao đề chọn driverId thay vì ngẫu nhiên?”
2. **Thử thêm một khía cạnh:** “Nếu luôn ưu tiên cùng một tài xế trong sản phẩm thật, cần đo thêm gì về fairness?”
3. **Cùng phát triển giải pháp:** “Một chính sách fairness mới có được thay thẳng rule chấm bài không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách deterministic tie-break đúng đề khỏi fairness policy của sản phẩm.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** driverId tie-break: ổn định và dễ test; đổi lại không đại diện công bằng phân phối chuyến dài hạn.
- **B.** Rotation/idle-time ở sản phẩm tương lai: cải thiện fairness theo mục tiêu; đổi lại thay contract và cần dữ liệu thêm.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="j12"></a>

### J12 — Chọn ba test bảo vệ bài tốt nhất

**Loại:** Kỹ thuật · **Phạm vi:** Testing; AC-08, AC-09

**Bối cảnh / giả lập:** Team chỉ còn ít thời gian trước demo, muốn tránh regression khi chỉnh UI/API.

**Câu mở đầu:** “Nếu chỉ giữ ba nhóm test quan trọng nhất cho dispatch, team sẽ chọn gì và vì sao?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Một test invariant nào quan trọng hơn chỉ kiểm tra HTTP 200?”
2. **Thử thêm một khía cạnh:** “Test nào bảo vệ rule ở mọi entry point?”
3. **Cùng phát triển giải pháp:** “Nếu sau này repository async, nhóm test nào cần nâng từ unit sang integration?”

**Hint nếu cần mở cuộc trao đổi:** Có thể ưu tiên double-book, lifecycle/exclusion và idempotent create trước các test cosmetic.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Unit/use-case tests: nhanh và giúp sửa rule dễ; đổi lại không chứng minh transaction/adapter thật.
- **B.** Integration/scenario tests: gần hành vi thực tế hơn; đổi lại chậm, setup nhiều và khó isolate lỗi hơn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/12ddecf913eb7c392df10a87da8513dd02fd17c8/coding-challenge-3/jessicanguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.


<a id="team-g"></a>

## Grace Phan — PR #21

Elixir/Phoenix; StateServer là owner cho authoritative state; dispatcher và expiration scheduler riêng; state volatile.

[PR](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/21) · [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md)

**Gợi ý chọn nhanh:** G1, G2, G8, G11. Đây là gợi ý điều hướng, không phải xếp hạng độ khó.

| Mã | Loại | Tình huống |
|---|---|---|
| [G1](#g1) | Kỹ thuật | Worker timeout nhưng lệnh có thể đã thành công |
| [G2](#g2) | Kỹ thuật | Phục hồi worker và phục hồi dữ liệu |
| [G3](#g3) | Kỹ thuật | Một owner đảm bảo đúng nhưng có thể chậm |
| [G4](#g4) | Kỹ thuật | Accept đúng thời điểm hết hạn |
| [G5](#g5) | Nghiệp vụ → kỹ thuật | Request accept cũ quay lại sau khi chuyến hoàn tất |
| [G6](#g6) | Kỹ thuật | Log success ở đúng thời điểm |
| [G7](#g7) | Nghiệp vụ | Khách chờ khi không còn tài xế |
| [G8](#g8) | Nghiệp vụ | Một tài xế từ chối riêng một khách |
| [G9](#g9) | Kỹ thuật | Lịch sử giữ mãi sẽ ảnh hưởng owner thế nào? |
| [G10](#g10) | Kỹ thuật | Test theo thời gian nhưng không chờ thời gian thật |
| [G11](#g11) | Nghiệp vụ | Chuẩn bị demo để người nghe hiểu lựa chọn đơn giản |
| [G12](#g12) | Nghiệp vụ → kỹ thuật | Giảm chờ của khách hay cho tài xế thêm thời gian? |
<a id="g1"></a>

### G1 — Worker timeout nhưng lệnh có thể đã thành công

**Loại:** Kỹ thuật · **Phạm vi:** AC-08, AC-10

**Bối cảnh / giả lập:** Worker gọi StateServer, chưa thấy response trong thời gian chờ; state có thể đã đổi.

**Câu mở đầu:** “Khi chưa biết thao tác đã thành công hay chưa, team quyết định retry bằng chứng nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu chỉ timeout ở caller, có thể kết luận business operation thất bại không?”
2. **Thử thêm một khía cạnh:** “Read-back receipt/event/offer sẽ giúp xác minh ra sao?”
3. **Cùng phát triển giải pháp:** “Nếu lần xác minh cũng timeout, hệ thống biểu đạt trạng thái chưa chắc chắn thế nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể so sánh retry cùng operation identity với tạo operation mới, giữ nguyên ý định ban đầu.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Read-back và retry idempotent: tránh lặp tác dụng phụ; đổi lại thêm vòng xác minh và trạng thái uncertain.
- **B.** Coi timeout là fail ngay: logic caller gọn; đổi lại dễ báo sai hoặc thực hiện hai lần khi retry bằng identity mới.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [resolve_timeout](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/event_dispatcher.ex); [failure semantics](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md).

<a id="g2"></a>

### G2 — Phục hồi worker và phục hồi dữ liệu

**Loại:** Kỹ thuật · **Phạm vi:** AC-10; phạm vi in-memory hợp lệ

**Bối cảnh / giả lập:** EventDispatcher chết rồi supervisor khởi động lại; một giả lập khác là StateServer/VM bị mất.

**Câu mở đầu:** “Team có thể giải thích khác nhau giữa hai kiểu restart này bằng một chuyến đang chờ không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Khi StateServer còn sống, worker tìm pending events bằng gì?”
2. **Thử thêm một khía cạnh:** “Khi nguồn state mất, supervisor có tự mang ride/receipt về không?”
3. **Cùng phát triển giải pháp:** “Muốn durability, dữ liệu nào cần lưu cùng nhau trước khi báo thành công?”

**Hint nếu cần mở cuộc trao đổi:** Bài cho phép in-memory; mục đích là nói đúng phạm vi recovery rồi bàn lựa chọn tiếp theo.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** In-memory owner: atomicity gọn và setup nhẹ; đổi lại mất runtime state khi owner/VM mất.
- **B.** Durable store cùng event/receipt: khôi phục được; đổi lại thêm transaction, schema và vận hành.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [supervision tree](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/application.ex); [init state](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/state_server.ex); [limits](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md).

**Ghi chú chuẩn bị riêng:** Supervisor restart worker không tương đương phục hồi state sau owner/VM mất. Đây là giới hạn đã được README thừa nhận, không phải bằng chứng bài in-memory sai scope.

<a id="g3"></a>

### G3 — Một owner đảm bảo đúng nhưng có thể chậm

**Loại:** Kỹ thuật · **Phạm vi:** AC-09; scalability

**Bối cảnh / giả lập:** Location updates, tạo ride và xử lý offer đều cần StateServer.

**Câu mở đầu:** “Điểm mạnh của một owner trong bài này là gì, và dấu hiệu nào báo nó bắt đầu quá tải?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Mailbox length và thời gian xử lý mỗi command cho biết điều gì khác nhau?”
2. **Thử thêm một khía cạnh:** “Có thể tối ưu matching/read path trước khi chia owner không?”
3. **Cùng phát triển giải pháp:** “Nếu chia theo vùng, driver đi qua ranh giới sẽ được chuyển quyền claim thế nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể mở rộng từng bước; không phải thấy bottleneck là lập tức phân tán mọi state.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Single owner: tuần tự và dễ giữ invariant; đổi lại một điểm giới hạn throughput/latency.
- **B.** Nhiều owner theo shard: tăng song song; đổi lại cần transfer/fencing hoặc DB invariant xuyên ranh giới.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [StateServer](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/state_server.ex); [scale discussion](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/docs/architecture.md).

<a id="g4"></a>

### G4 — Accept đúng thời điểm hết hạn

**Loại:** Kỹ thuật · **Phạm vi:** AC-05; clocks

**Bối cảnh / giả lập:** Offer hết hạn tại T; accept đến đúng T trong khi scheduler chưa chạy.

**Câu mở đầu:** “Team định nghĩa thời điểm offer hết hiệu lực thế nào, và chỗ nào kiểm tra điều đó?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Timer chạy chậm có làm offer sống lâu hơn về mặt business không?”
2. **Thử thêm một khía cạnh:** “Vì sao dùng monotonic clock trong VM thay vì chỉ đọc giờ hệ thống?”
3. **Cùng phát triển giải pháp:** “Nếu cần persist deadline qua VM restart, cách lưu thời gian có phải đổi không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách deadline nghiệp vụ khỏi thời điểm job thực sự dọn trạng thái.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Monotonic deadline trong VM: tránh clock jump khi so duration; đổi lại không mang nguyên timestamp sang VM mới.
- **B.** Persist wall-clock deadline kèm policy clock: khôi phục được qua restart; đổi lại phải xử lý clock skew/jump và contract rõ.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [timeout contract](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md); [accept/expiry checks](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/state_server.ex).

<a id="g5"></a>

### G5 — Request accept cũ quay lại sau khi chuyến hoàn tất

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-08; API contract

**Bối cảnh / giả lập:** D1 đã accept và complete R1; mạng gửi lại accept trước đó.

**Câu mở đầu:** “Team muốn trả lời retry này thế nào để client hiểu thao tác cũ đã thành công mà không hiểu nhầm chuyến còn đang chạy?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Receipt nào chứng minh accept từng thành công?”
2. **Thử thêm một khía cạnh:** “Kết quả replay có khác GET ride hiện tại không?”
3. **Cùng phát triển giải pháp:** “Nếu route không có offerId và lịch sử mơ hồ, team chọn từ chối hay đoán offer?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bàn operation result và current state như hai thông tin khác nhau.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Receipt gắn offer: replay có căn cứ và ổn định; đổi lại giữ thêm lịch sử và xử lý ambiguity.
- **B.** Chỉ nhìn terminal state: ít dữ liệu hơn; đổi lại không biết thao tác trước có thật sự thành công hay không.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [immutable results and ambiguity](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md); [resolve acceptance](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/state_server.ex).

<a id="g6"></a>

### G6 — Log success ở đúng thời điểm

**Loại:** Kỹ thuật · **Phạm vi:** Observability; audit ngoài yêu cầu tối thiểu

**Bối cảnh / giả lập:** Business state vừa được cập nhật; team muốn log phản ánh điều đã thực sự áp dụng.

**Câu mở đầu:** “Vì sao team đặt logging trong handle_continue, và cách này giúp người điều tra tin điều gì?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu response và log xuất hiện khác thứ tự thì correlate bằng trường nào?”
2. **Thử thêm một khía cạnh:** “Nếu owner chết trước log, có thể mất bằng chứng nào?”
3. **Cùng phát triển giải pháp:** “Có cần audit bền vững cho scope challenge không, hay best effort là đủ?”

**Hint nếu cần mở cuộc trao đổi:** Có thể phân biệt log phục vụ quan sát với durable audit trail.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Log sau installation: tránh ghi success trước state install; đổi lại vẫn có crash window mất log.
- **B.** Audit record bền vững cùng business commit: mạnh hơn khi truy vết; đổi lại thêm I/O, retention và dữ liệu quản lý.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [handle_continue](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/lib/ride_dispatch/dispatch/state_server.ex); [correlation and commit boundary](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md).

<a id="g7"></a>

### G7 — Khách chờ khi không còn tài xế

**Loại:** Nghiệp vụ · **Phạm vi:** AC-07; wake-up ngoài minimum

**Bối cảnh / giả lập:** R1 đã xử lý event matching nhưng không có candidate; sau đó có người online.

**Câu mở đầu:** “Khách nên hiểu điều gì khi ride vẫn MATCHING nhưng event matching đã processed?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Đây là kết quả nghiệp vụ bình thường hay technical failure?”
2. **Thử thêm một khía cạnh:** “Muốn tự tìm lại khi có xe, team thêm trigger ở đâu?”
3. **Cùng phát triển giải pháp:** “Nếu có nhiều khách chờ, có cần queue policy trước khi tự động wake-up không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể giữ no-candidate là kết quả hợp lệ và thêm một policy retry độc lập.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Chờ trigger rõ ràng: ít công việc thừa và dễ debug; đổi lại không tự phản ứng nếu không có trigger mới.
- **B.** Wake-up/scheduled rematch: tăng cơ hội tự có xe; đổi lại tải, fairness và tránh busy loop.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="g8"></a>

### G8 — Một tài xế từ chối riêng một khách

**Loại:** Nghiệp vụ · **Phạm vi:** AC-05, AC-07

**Bối cảnh / giả lập:** D1 reject R1 nhưng vẫn muốn nhận khách khác gần đó.

**Câu mở đầu:** “Team có thể demo sự khác nhau giữa bị loại khỏi một ride và không còn available toàn hệ thống không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “R1 tìm lại có bao giờ quay về D1 không?”
2. **Thử thêm một khía cạnh:** “R2 mới tạo có được chọn D1 không?”
3. **Cùng phát triển giải pháp:** “Nếu timeout thay reject, scope exclusion có thay đổi theo đề không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể biểu diễn exclusion theo cặp ride/driver, tách khỏi trạng thái available chung.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Exclusion riêng từng ride: đúng đề và không lãng phí đội xe; đổi lại lưu lịch sử/tra cứu theo ride.
- **B.** Loại driver toàn hệ thống: logic đơn giản nhưng sai ý nghĩa nghiệp vụ; chỉ phù hợp nếu có policy riêng về chất lượng, ngoài bài.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="g9"></a>

### G9 — Lịch sử giữ mãi sẽ ảnh hưởng owner thế nào?

**Loại:** Kỹ thuật · **Phạm vi:** AC-08; scalability; đề xuất phát triển

**Bối cảnh / giả lập:** StateServer giữ rides, offers, events và receipts trong memory qua nhiều lượt demo dài.

**Câu mở đầu:** “Nếu ứng dụng chạy lâu, team muốn giữ lại những dữ liệu nào và trong bao lâu?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Xóa receipt có làm mất guarantee retry cũ không?”
2. **Thử thêm một khía cạnh:** “Quét expiration và matching có bị chậm khi lịch sử tăng không?”
3. **Cùng phát triển giải pháp:** “Team cần tách active working set và history trước hay thêm DB trước?”

**Hint nếu cần mở cuộc trao đổi:** Có thể chọn retention theo cửa sổ retry và mục đích điều tra, chưa cần xóa ngay mọi terminal ride.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Giữ toàn bộ: replay và điều tra dễ; đổi lại memory/scan tăng không giới hạn.
- **B.** Archive/retention: working set nhỏ hơn; đổi lại phải định nghĩa retry quá hạn và tìm lịch sử.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="g10"></a>

### G10 — Test theo thời gian nhưng không chờ thời gian thật

**Loại:** Kỹ thuật · **Phạm vi:** Testing; AC-05, AC-09

**Bối cảnh / giả lập:** Team muốn thử nhiều tổ hợp accept/reject/expire/cancel sát nhau.

**Câu mở đầu:** “Bộ controlled clock và worker coordination giúp test đáng tin hơn như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Làm sao tiến clock đến đúng equality boundary?”
2. **Thử thêm một khía cạnh:** “Test đồng thời kiểm tra kết quả API hay invariant trên toàn state?”
3. **Cùng phát triển giải pháp:** “Có interleaving nào vẫn cần test integration thay vì pure state-machine test?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ timeline rồi dùng clock/barrier điều khiển từng mốc.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Controlled clock: nhanh, lặp lại và test biên tốt; đổi lại không chứng minh mọi scheduler/network timing thực.
- **B.** Realtime integration: gần runtime hơn; đổi lại chậm và dễ flaky nếu dùng sleep thay điều kiện chờ.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="g11"></a>

### G11 — Chuẩn bị demo để người nghe hiểu lựa chọn đơn giản

**Loại:** Nghiệp vụ · **Phạm vi:** Architecture; communication

**Bối cảnh / giả lập:** Người nghe thấy in-memory và một StateServer, có thể nghĩ thiếu kiến trúc.

**Câu mở đầu:** “Nếu giải thích trong một phút, team muốn khán giả nhớ quyết định nào và giới hạn nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Team sẽ chọn tình huống nào để chứng minh lợi ích atomic owner?”
2. **Thử thêm một khía cạnh:** “Điều gì được chủ động bỏ qua để giữ scope 4–6 giờ?”
3. **Cùng phát triển giải pháp:** “Nếu có thêm một ngày, cải tiến đầu tiên là durability hay performance, và vì sao?”

**Hint nếu cần mở cuộc trao đổi:** Có thể lấy một invariant và một failure boundary làm câu chuyện chính, thay vì liệt kê công nghệ.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Scope nhỏ nhưng có chứng cứ: dễ hiểu và kiểm tra; đổi lại ít tính năng trình diễn.
- **B.** Nhiều infrastructure: có thêm tình huống học tập; đổi lại thời gian setup có thể lấn phần correctness.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="g12"></a>

### G12 — Giảm chờ của khách hay cho tài xế thêm thời gian?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05; policy tương lai

**Bối cảnh / giả lập:** Khách muốn có xe nhanh; tài xế đôi khi cần hơn 30 giây vì mạng chậm.

**Câu mở đầu:** “Team sẽ thảo luận tác động của offer timeout với hai phía như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Thước đo nào phân biệt tài xế không muốn nhận với không nhận được offer?”
2. **Thử thêm một khía cạnh:** “Nếu chỉ tăng timeout, hệ thống sẽ giữ năng lực đội xe lâu hơn ra sao?”
3. **Cùng phát triển giải pháp:** “Nếu muốn đổi policy theo vùng, cần version cấu hình và test gì?”

**Hint nếu cần mở cuộc trao đổi:** Đề dùng default 30 giây; thảo luận policy khác là mở rộng, không yêu cầu team phải đã làm.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Timeout cố định: dễ dự đoán/test; đổi lại không thích ứng mạng và vùng.
- **B.** Policy thích ứng: có thể phù hợp bối cảnh hơn; đổi lại khó giải thích, đo lường và tái hiện quyết định.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/38b1dc24fdb5a5aafa1cea4005e19f5b2de7679f/coding-challenge-3/grace-phan/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.


<a id="team-l"></a>

## Light Nguyen — PR #22

Hai ASP.NET service; EF Core/SQLite; RabbitMQ; Driver Management giữ offer. Quy mô triển khai hiện tại khác giả định thêm replica.

[PR](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/22) · [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md)

**Gợi ý chọn nhanh:** L11, L1, L6, L10. Đây là gợi ý điều hướng, không phải xếp hạng độ khó.

| Mã | Loại | Tình huống |
|---|---|---|
| [L1](#l1) | Nghiệp vụ → kỹ thuật | Tài xế phản hồi sau hạn vì màn hình chưa đóng |
| [L2](#l2) | Kỹ thuật | Ride đã lưu nhưng message chưa gửi |
| [L3](#l3) | Nghiệp vụ → kỹ thuật | Khách/tài xế bấm lại cùng thao tác |
| [L4](#l4) | Kỹ thuật | Một ride nhưng hai consumer |
| [L5](#l5) | Nghiệp vụ | Passenger ID hợp lệ nhưng chưa tồn tại |
| [L6](#l6) | Nghiệp vụ → kỹ thuật | Chuyến chờ vì một lỗi DB thoáng qua |
| [L7](#l7) | Nghiệp vụ | Hợp đồng dữ liệu thống nhất cho client |
| [L8](#l8) | Kỹ thuật | SQLite khi thêm nhiều worker |
| [L9](#l9) | Nghiệp vụ | Tài xế kết thúc ca khi đang được giữ offer |
| [L10](#l10) | Nghiệp vụ → kỹ thuật | Match được D1 nhưng claim thất bại |
| [L11](#l11) | Nghiệp vụ | Định nghĩa ý nghĩa của 202 Accepted |
| [L12](#l12) | Kỹ thuật | Quan sát chuyến xuyên hai service |
<a id="l1"></a>

### L1 — Tài xế phản hồi sau hạn vì màn hình chưa đóng

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-06

**Bối cảnh / giả lập:** Offer đã qua 30 giây nhưng job expire chưa chạy; D1 vẫn thấy nút accept.

**Câu mở đầu:** “Team muốn deadline do màn hình, scheduler hay thao tác accept tại server quyết định?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu accept đến sau hạn nhưng status còn PENDING thì kết quả nên là gì?”
2. **Thử thêm một khía cạnh:** “Nếu accept và job expiry cùng đọc PENDING, DB có cách chọn một kết quả không?”
3. **Cùng phát triển giải pháp:** “Team muốn test biên thời gian và hai DbContext như thế nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể coi scheduler là cách dọn state; business deadline vẫn cần guard tại quyết định accept.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Guard deadline + CAS tại DB: quyết định nhất quán hơn; đổi lại SQL/concurrency policy rõ và test kỹ.
- **B.** Chỉ scheduler đổi status: ít logic ở accept; đổi lại có cửa sổ accept muộn và race khi job chạy.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [AcceptOffer và ExpirePendingOffers](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Services/DriverService.cs); [expiry worker](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Services/OfferExpirationService.cs).

**Ghi chú nội bộ từ lần kiểm tra trước — không đọc thành lời buộc lỗi:** `AcceptOffer(rideId, driverId)` kiểm tra status PENDING nhưng không kiểm tra thời điểm hết hạn; expiry do job riêng xử lý. Theo đọc code, có cửa sổ accept muộn; chưa chạy .NET để tái hiện runtime.

**Ghi chú chuẩn bị riêng:** Theo đọc code, AcceptOffer kiểm tra PENDING nhưng không kiểm tra expiry ngay; worker riêng mới expire. Chưa chạy .NET để tái hiện runtime, nên mở bằng giả lập và mời team chỉ ra guard.

<a id="l2"></a>

### L2 — Ride đã lưu nhưng message chưa gửi

**Loại:** Kỹ thuật · **Phạm vi:** AC-10, AC-08

**Bối cảnh / giả lập:** API lưu ride rồi cần publish RabbitMQ; giả lập crash đúng giữa hai bước.

**Câu mở đầu:** “Team muốn ride được tự đi tiếp bằng cơ chế nào nếu client không gửi lại request?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Publisher confirm bảo vệ đoạn nào, chưa bảo vệ đoạn nào?”
2. **Thử thêm một khía cạnh:** “Nếu dùng outbox, record và ride nên ghi cùng transaction nào?”
3. **Cùng phát triển giải pháp:** “Nếu replay create event của một ride đã terminal, consumer cần biết gì để không mở offer mới?”

**Hint nếu cần mở cuộc trao đổi:** Có thể vẽ hai dấu commit DB/broker rồi đặt crash ở từng khe trước khi chọn pattern.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Publish trực tiếp sau save: đơn giản và ít thành phần; đổi lại crash gap và phụ thuộc client retry/reconciliation.
- **B.** Transactional outbox: bảo toàn ý định phát event cùng local commit; đổi lại relay, duplicate và cleanup.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [CreateRide/ReturnIdempotentRide](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.RideManagement/Services/RideService.cs); [RideCreatedConsumer](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Services/RideCreatedConsumer.cs).

**Ghi chú chuẩn bị riêng:** ReturnIdempotentRide chỉ chặn republish khi current ride CANCELLED. Cần cùng kiểm tra biến thể create retry sau COMPLETED để tránh active offer mới ở driver side; chưa tái hiện runtime.

<a id="l3"></a>

### L3 — Khách/tài xế bấm lại cùng thao tác

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-08; API contract

**Bối cảnh / giả lập:** Accept đã hoàn tất và ride đã DRIVER_ACCEPTED; client retry vì response trước bị mất.

**Câu mở đầu:** “Team muốn API trả gì cho một retry hợp lệ sau khi các service đã đồng bộ?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Guard ở ride-service có cho request tới logic replay phía driver-service không?”
2. **Thử thêm một khía cạnh:** “Conflict có bảo vệ state nhưng vẫn khiến client không biết thao tác trước thành công không?”
3. **Cùng phát triển giải pháp:** “Có cần receipt hoặc operation status để trả lời nhất quán không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể phân biệt idempotent effect với khả năng trả lại kết quả thành công cũ.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Replay dựa evidence: client ít mơ hồ; đổi lại cần giữ identity/result đủ lâu.
- **B.** Từ chối khi state không còn ASSIGNED: bảo vệ transition đơn giản; đổi lại retry thành công cũ có thể nhận conflict.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [RequestOfferResponse](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.RideManagement/Services/RideService.cs); [AcceptOffer replay](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Services/DriverService.cs).

**Ghi chú chuẩn bị riêng:** RideService.RequestOfferResponse đòi DRIVER_ASSIGNED, nên retry sau khi ride đã DRIVER_ACCEPTED bị chặn trước logic replay ở DriverService. State safety và success replay là hai contract khác nhau.

<a id="l4"></a>

### L4 — Một ride nhưng hai consumer

**Loại:** Kỹ thuật · **Phạm vi:** AC-05, AC-09

**Bối cảnh / giả lập:** Team tăng replica; hai consumer cùng thấy R1 chưa có active offer và chọn hai driver khác nhau.

**Câu mở đầu:** “Ngoài bảo vệ một driver không nhận hai chuyến, team bảo vệ một ride không có hai active offer thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Index hiện đang bảo vệ theo driver, theo ride hay cả hai?”
2. **Thử thêm một khía cạnh:** “Prefetch=1 trên một consumer còn đủ khi có replica không?”
3. **Cùng phát triển giải pháp:** “Nếu thêm unique active offer theo RideId, bên thua sẽ retry hoặc đọc lại ra sao?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ hai invariant độc lập: một xe–một chuyến và một chuyến–một offer hiện tại.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Constraint cả ride và driver: bảo vệ mọi writer cùng DB; đổi lại xử lý conflict và migration.
- **B.** Dựa vào một consumer tuần tự: ít xung đột hiện tại; đổi lại guarantee phụ thuộc deployment và không đủ khi scale.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [unique index](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Data/ApplicationDbContext.cs); [check then create](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.DriverManagement/Services/RideCreatedConsumer.cs).

**Ghi chú chuẩn bị riêng:** Model configuration có unique active offer theo DriverId, chưa thấy unique active offer theo RideId. Giả lập nhiều replica là hướng kiểm chứng, không tuyên bố môi trường hiện tại đã tạo hai offer.

<a id="l5"></a>

### L5 — Passenger ID hợp lệ nhưng chưa tồn tại

**Loại:** Nghiệp vụ · **Phạm vi:** AC-01

**Bối cảnh / giả lập:** Client gửi UUID đúng định dạng cho passenger chưa seed.

**Câu mở đầu:** “Theo phạm vi challenge, team muốn phân biệt dữ liệu hợp lệ về định dạng với passenger có tồn tại như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Validation nên ở API, use-case hay FK với vai trò khác nhau?”
2. **Thử thêm một khía cạnh:** “Nếu passenger chưa có thì trả lỗi nào để client sửa được?”
3. **Cùng phát triển giải pháp:** “Team có test đúng UUID nhưng không có record không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng hai ví dụ: chuỗi sai định dạng và UUID đúng nhưng unknown passenger.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Kiểm tra tồn tại + constraint phù hợp: rõ lỗi và giữ dữ liệu hợp lệ; đổi lại thêm lookup/seed/relationship.
- **B.** Chỉ kiểm tra UUID: setup nhẹ; đổi lại chưa đáp ứng yêu cầu reference passenger của AC-01.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [passenger contract](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md); [CreateRide](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.RideManagement/Services/RideService.cs); [model configuration](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.RideManagement/Data/ApplicationDbContext.cs).

**Ghi chú chuẩn bị riêng:** README cho phép UUID bất kỳ; CreateRide chưa thấy query Passenger và config chưa thấy relationship/FK cho requirement reference passenger.

<a id="l6"></a>

### L6 — Chuyến chờ vì một lỗi DB thoáng qua

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-10; observability

**Bối cảnh / giả lập:** Message vào consumer lúc DB tạm lỗi rồi bị dead-letter; DB sau đó phục hồi.

**Câu mở đầu:** “Trong ca trực, team làm sao biết chuyến này cần được thử lại và thử lại an toàn?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Lỗi kỹ thuật tạm thời và lỗi payload có nên chung policy không?”
2. **Thử thêm một khía cạnh:** “Ai thấy dead queue đang tăng và tra được rideId nào?”
3. **Cùng phát triển giải pháp:** “Khi replay, điều gì ngăn tạo offer hoặc chuyển state hai lần?”

**Hint nếu cần mở cuộc trao đổi:** Có thể cùng phác một runbook gồm phát hiện, xác định nguyên nhân, replay và kiểm chứng state.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Dead-letter ngay: tránh retry vô ích và giữ lỗi để điều tra; đổi lại lỗi thoáng qua cũng cần thao tác phục hồi.
- **B.** Bounded retry + DLQ: tự qua lỗi ngắn; đổi lại tăng latency và cần tránh poison message kẹt queue.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát trong bài nộp:** [consumer nack](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/CodingChallenge.Share/Messaging/RabbitMqConsumer.cs); [failure policy](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md).

<a id="l7"></a>

### L7 — Hợp đồng dữ liệu thống nhất cho client

**Loại:** Nghiệp vụ · **Phạm vi:** AC-01, AC-03; API communication

**Bối cảnh / giả lập:** Client dùng longitude ở API tài xế nhưng mẫu create ride dùng longtitude.

**Câu mở đầu:** “Nếu frontend chỉ muốn dùng một model tọa độ, team sẽ thống nhất hợp đồng API như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu đổi tên field, client đang dùng bản cũ sẽ bị ảnh hưởng gì?”
2. **Thử thêm một khía cạnh:** “Có cần nhận cả tên cũ/tên mới trong giai đoạn chuyển tiếp không?”
3. **Cùng phát triển giải pháp:** “Test contract nào giúp tránh một endpoint nhận tọa độ khác endpoint kia?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bàn DTO public riêng với tên field nội bộ, không nhất thiết đổi mọi storage field cùng lúc.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Đổi thống nhất ngay ở demo: dễ hiểu và ít nợ; đổi lại client/mẫu request cũ cần sửa.
- **B.** Alias có thời hạn/version API: chuyển tiếp nhẹ hơn; đổi lại validation và quy tắc conflict hai tên cần rõ.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

**Ghi chú chuẩn bị riêng:** README ghi rõ ride model dùng longtitude còn driver-location request dùng longitude. Câu hỏi chủ yếu về contract/migration, không phải chê lỗi chính tả.

<a id="l8"></a>

### L8 — SQLite khi thêm nhiều worker

**Loại:** Kỹ thuật · **Phạm vi:** Architecture; AC-09; scale

**Bối cảnh / giả lập:** Giải pháp chọn SQLite để dễ chạy local; dự kiến thêm consumer và API instance.

**Câu mở đầu:** “Điều gì khiến SQLite phù hợp ở đây, và dấu hiệu nào khiến team cân nhắc đổi database?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Test đang dùng cùng file DB với nhiều connection hay DB tách biệt?”
2. **Thử thêm một khía cạnh:** “Nếu lock contention tăng, retry ở tầng nào và có giữ idempotency không?”
3. **Cùng phát triển giải pháp:** “Đổi sang Postgres có tự sửa race check-then-write không, hay phải đổi câu lệnh nữa?”

**Hint nếu cần mở cuộc trao đổi:** Có thể giữ lựa chọn đơn giản hôm nay và liệt kê điều kiện đo được để đổi, thay vì chọn DB theo tên tuổi.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** SQLite: setup nhẹ, dữ liệu bền vững local; đổi lại cần thiết kế kỹ concurrent writes và deployment chia sẻ file.
- **B.** Postgres: hỗ trợ nhiều writer/service deployment thuận hơn; đổi lại thêm hạ tầng, còn invariant/CAS vẫn phải viết đúng.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="l9"></a>

### L9 — Tài xế kết thúc ca khi đang được giữ offer

**Loại:** Nghiệp vụ · **Phạm vi:** AC-02

**Bối cảnh / giả lập:** D1 nhận offer nhưng bấm unavailable vì cần nghỉ.

**Câu mở đầu:** “Với rule của đề, team muốn API availability phản hồi ra sao khi tài xế đang OFFERED hoặc BUSY?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Làm thế nào phân biệt yêu cầu offline với reject offer hiện tại?”
2. **Thử thêm một khía cạnh:** “Nếu app gửi lại cùng availability request thì khi nào là no-op hợp lệ?”
3. **Cùng phát triển giải pháp:** “Một test đi từ HTTP có giúp chứng minh API dùng đúng domain guard không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể để offline trả conflict trong khi OFFERED, và cho tài xế dùng reject trước; đây là contract khác auto-cancel offer.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Chặn offline khi đang giữ việc: bám invariant và rõ ownership; đổi lại app cần giải thích/tác vụ reject hoặc complete.
- **B.** Cho offline rồi tự bù: trải nghiệm một nút đơn giản; đổi lại lệch yêu cầu AC-02 và cần policy mới rõ ràng.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

**Ghi chú chuẩn bị riêng:** DriverService.UpdateDriverAvailability gán Status trực tiếp, không gọi GoOffline của domain. Nếu bàn AC-02, nên kiểm tra đường HTTP/use-case thực thay vì chỉ domain tests.

<a id="l10"></a>

### L10 — Match được D1 nhưng claim thất bại

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-04, AC-09; latency trade-off

**Bối cảnh / giả lập:** Hai ride cùng chọn D1; R1 giữ được, R2 mất claim nhưng vẫn có D2 gần đó.

**Câu mở đầu:** “Trong lần matching của R2, team muốn thử D2 ngay hay để MATCHING chờ lần sau?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu chỉ return no-driver sau lost claim, khác gì thật sự hết xe?”
2. **Thử thêm một khía cạnh:** “Muốn thử ngay, nên trả danh sách ứng viên hay query lại có exclusion tạm thời?”
3. **Cùng phát triển giải pháp:** “Có cách nào giới hạn số lần thử để tránh request/event xử lý quá lâu không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng bounded retry theo candidate và phân biệt skip tạm thời với reject vĩnh viễn cho ride.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Thử ứng viên tiếp ngay: tận dụng xe còn trống; đổi lại tăng work/latency của một attempt.
- **B.** Để lần retry sau: mỗi attempt gọn; đổi lại khách đợi lâu và cần trigger retry đáng tin cậy.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

**Ghi chú chuẩn bị riêng:** RideCreatedConsumer hiện đặt driverId=null nếu SendOfferToDriver mất claim, rồi publish DriverMatched(null); nhánh đó chưa tự loop qua ứng viên tiếp trong cùng attempt.

<a id="l11"></a>

### L11 — Định nghĩa ý nghĩa của 202 Accepted

**Loại:** Nghiệp vụ · **Phạm vi:** AC-05, AC-10; API semantics

**Bối cảnh / giả lập:** Accept/reject/cancel API trả 202, kết quả nghiệp vụ cập nhật sau message.

**Câu mở đầu:** “Team muốn client hiểu 202 là đã nhận yêu cầu hay thao tác nghiệp vụ chắc chắn thành công?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Client theo dõi kết quả bằng GET ride hay operation ID?”
2. **Thử thêm một khía cạnh:** “Nếu command bị từ chối phía consumer, làm sao client nhận ra lý do?”
3. **Cùng phát triển giải pháp:** “Nếu client retry ngay trước khi kết quả cập nhật, có cần operation dedup không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách command admission khỏi business completion; cả hai contract đều có thể hợp lý nếu nói rõ.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** 202 + operation tracking: hợp với bất đồng bộ; đổi lại thêm endpoint/state và client polling.
- **B.** Chờ kết quả cuối để trả response: client đơn giản hơn; đổi lại request lâu và phụ thuộc service/broker.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.

<a id="l12"></a>

### L12 — Quan sát chuyến xuyên hai service

**Loại:** Kỹ thuật · **Phạm vi:** Observability; AC-10

**Bối cảnh / giả lập:** Khách báo đã đợi lâu, ca trực chỉ có rideId.

**Câu mở đầu:** “Team sẽ đi từ rideId đến event, offer và driver qua hai service theo trình tự nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Log nào cần cùng correlation ID và event ID để phân biệt retry?”
2. **Thử thêm một khía cạnh:** “Làm sao phân biệt broker chậm, DB lỗi và không có candidate?”
3. **Cùng phát triển giải pháp:** “Nếu chỉ bổ sung một dashboard hoặc log record, team chọn gì trước?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu với structured lifecycle logs theo rideId/driverId/eventId, chưa cần stack observability lớn.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Structured logs tối thiểu: ít setup và sát đề; đổi lại điều tra nhiều request vẫn thủ công.
- **B.** Metrics/traces bổ sung: nhìn backlog/latency và luồng liên service tốt hơn; đổi lại vận hành, sampling và chi phí dữ liệu.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Điểm xuất phát:** [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/c471fa8b660f76f8b6e6d77fa5692b7fa9d77e75/coding-challenge-3/lightnguyen/README.md). Đây là tình huống thảo luận/mở rộng; không khẳng định team đã có policy hoặc hạ tầng trong giả lập.


<a id="team-k"></a>

## KVP — PR #20

Ba Go service: ride giữ lifecycle, driver giữ quyền tài xế, dispatch giữ offer/saga; PostgreSQL, Redis GEO projection, Redpanda và OpenTelemetry.

[PR](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/20) · [README snapshot đã đọc](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/README.md)

**Gợi ý chọn nhanh:** K2, K6, K9, K11, K12, K20, K21. Đây là gợi ý điều hướng, không phải xếp hạng độ khó.

| Mã | Loại | Tình huống |
|---|---|---|
| [K1](#k1) | Kỹ thuật | Vì sao microservices và saga, đề cho phép monolith mà? |
| [K2](#k2) | Nghiệp vụ → kỹ thuật | Hai ride cùng chọn D1, ai thắng? |
| [K3](#k3) | Nghiệp vụ | Reject rồi vì sao không quay lại D1? |
| [K4](#k4) | Kỹ thuật | Accept đúng lúc timeout thì sao? |
| [K5](#k5) | Nghiệp vụ → kỹ thuật | Accept trả 200 nhưng GET ride chưa DRIVER_ACCEPTED? |
| [K6](#k6) | Nghiệp vụ → kỹ thuật | Accept và cancel chạy đồng thời, có bảo đảm chỉ một request thành công? |
| [K7](#k7) | Kỹ thuật | Idempotency khác nhau ở API, message và business action? |
| [K8](#k8) | Kỹ thuật | Crash ở giữa DB và broker thì sao? Exactly-once chưa? |
| [K9](#k9) | Nghiệp vụ → kỹ thuật | Redis cũ: chống trùng tài xế có đồng nghĩa matching luôn đúng? |
| [K10](#k10) | Nghiệp vụ → kỹ thuật | Redis mất dữ liệu có tự rebuild liên tục không? |
| [K11](#k11) | Kỹ thuật | Message xử lý lỗi, rồi gửi DLQ cũng lỗi? |
| [K12](#k12) | Nghiệp vụ → kỹ thuật | Sau pivot, ‘retry until done’ đã thật sự đầy đủ chưa? |
| [K13](#k13) | Kỹ thuật | Cùng Kafka key đã bảo đảm thứ tự khi nhiều relay? |
| [K14](#k14) | Nghiệp vụ → kỹ thuật | 1 triệu tài xế có chạy được chưa? |
| [K15](#k15) | Nghiệp vụ → kỹ thuật | Điều tra ‘R001 không tìm được tài xế’ như thế nào? |
| [K16](#k16) | Kỹ thuật | Chọn gần nhất và tie-break có thật sự nhất quán? |
| [K17](#k17) | Nghiệp vụ | Gần theo đường chim bay có phải đón nhanh nhất? |
| [K18](#k18) | Nghiệp vụ | Không có xe: khách chờ bao lâu và thấy gì? |
| [K19](#k19) | Nghiệp vụ | Retry một lần đặt và chủ động đặt chuyến mới |
| [K20](#k20) | Kỹ thuật | GPS cũ tới server sau GPS mới |
| [K21](#k21) | Kỹ thuật | Push offer bằng gRPC đã bỏ hết polling chưa? |
| [K22](#k22) | Kỹ thuật | Test nào chứng minh được đúng lớp rủi ro? |
| [K23](#k23) | Kỹ thuật | Đổi retention có làm mất idempotency? |
| [K24](#k24) | Nghiệp vụ | Nếu chỉ có thêm một ngày, nhóm cải tiến gì trước? |
<a id="k1"></a>

### K1 — Vì sao microservices và saga, đề cho phép monolith mà?

**Loại:** Kỹ thuật · **Phạm vi:** Architecture; timebox

**Bối cảnh / giả lập:** Một team nhỏ cần giao bản demo trong 4–6 giờ, nhưng cũng muốn học distributed workflows.

**Câu mở đầu:** “Nếu bắt đầu lại với cùng bài toán và timebox, team vẫn chọn microservices chứ?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Giá trị nào là cho sản phẩm, giá trị nào là mục tiêu học tập?”
2. **Thử thêm một khía cạnh:** “Chi phí vận hành lớn nhất do lựa chọn này là gì?”
3. **Cùng phát triển giải pháp:** “Điều kiện nào khiến team gộp lại modular monolith?”

**Hint nếu cần mở cuộc trao đổi:** Có thể công nhận monolith là phương án đủ dùng trước khi giải thích mục tiêu học tập.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Microservices: ownership/scale riêng; đổi lại network, recovery và nhiều thành phần.
- **B.** Modular monolith: giao nhanh và local transaction; đổi lại deploy/scale chung.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Với khoảng 1.000 tài xế và một team, modular monolith là lựa chọn đơn giản và đủ dùng. Nhóm chủ động chọn microservices và saga làm mục tiêu học tập, không phải vì đề bắt buộc. Location updates và ride lifecycle có tải khác nhau nên ranh giới này có lý do để phát triển sau. Đổi lại, nhóm phải xử lý eventual consistency, recovery và vận hành nhiều thành phần. ADR cũng ghi nhận bài vượt timebox; nếu ưu tiên giao sản phẩm trong 4–6 giờ, nhóm sẽ chọn monolith trước.”

**Bằng chứng:** [ADR-006](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/adr/ADR-006-service-architecture.md). T1 là ràng buộc/mục tiêu do team tự ghi, chưa có bằng chứng đó là yêu cầu chung của ban tổ chức. Không nói “đề bắt microservices”.

<a id="k2"></a>

### K2 — Hai ride cùng chọn D1, ai thắng?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-09

**Bối cảnh / giả lập:** Chỉ còn một xe gần điểm đón; hai hành khách đặt cùng lúc, đều cần biết mình có xe thật hay chưa.

**Câu mở đầu:** “Team làm thế nào để chỉ một khách thực sự giữ được D1?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Điểm nào mới được xem là giữ xe thành công?”
2. **Thử thêm một khía cạnh:** “Bên thua tiếp tục thử xe khác hay chờ?”
3. **Cùng phát triển giải pháp:** “Test nào chứng minh điều này với DB thật?”

**Hint nếu cần mở cuộc trao đổi:** Có thể đi từ hành vi của hai khách tới conditional UPDATE thay vì mở đầu bằng lock.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** DB CAS: bảo vệ nhiều replica cùng DB; đổi lại conflict và hotspot.
- **B.** App lock: đơn giản trong process; đổi lại không đủ cho nhiều process.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Cùng nhìn thấy D1 trong Redis vẫn chưa được xem là đã nhận tài xế. Driver-service chạy một UPDATE chỉ thành công khi status còn AVAILABLE, đồng thời đặt OFFERED và current_ride_id. PostgreSQL khóa dòng và kiểm tra lại điều kiện nên chỉ một transaction thắng. Bên thua nhận reservation-failed, dispatch thử ứng viên khác; nếu hết ứng viên thì ride tiếp tục MATCHING. Khi D1 đang BUSY, điều kiện AVAILABLE cũng không còn thỏa.”

**Bằng chứng:** [ReserveIfAvailable](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/driver/internal/adapter/postgres/postgres.go); [TestConcurrentReservationOnlyOneWins](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/driver/internal/adapter/postgres/postgres_integration_test.go); [TestTwoRidesCannotOfferTheSameDriver](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator_integration_test.go).

**Nếu hỏi “unique index đủ chưa?”:** “Partial unique index trên pending offers là lớp bảo vệ thêm ở dispatch; driver row và current_ride_id mới bảo vệ cả pending lẫn accepted ride. Không dựa vào index chỉ chứa PENDING để chứng minh BUSY cũng an toàn.”

<a id="k3"></a>

### K3 — Reject rồi vì sao không quay lại D1?

**Loại:** Nghiệp vụ · **Phạm vi:** AC-05, AC-07

**Bối cảnh / giả lập:** D1 không muốn nhận R1 nhưng vẫn muốn nhận các chuyến khác.

**Câu mở đầu:** “Sau khi D1 reject, hành trình tìm xe cho R1 và khả năng nhận R2 của D1 thay đổi thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Exclusion được giữ theo ride hay theo driver toàn hệ thống?”
2. **Thử thêm một khía cạnh:** “Nếu hết tất cả ứng viên, khách thấy trạng thái gì?”
3. **Cùng phát triển giải pháp:** “Làm sao chứng minh D1 không quay lại cùng chuyến sau khi available?”

**Hint nếu cần mở cuộc trao đổi:** Có thể vẽ hai ride cùng D1 để tách exclusion khỏi availability.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Exclusion per ride: đúng ý nghĩa và giữ năng lực cho ride khác; đổi lại cần lịch sử tra cứu.
- **B.** Đánh dấu driver unavailable chung: dễ làm nhưng sai rule bài và lãng phí năng lực.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Reject và timeout dùng chung đường endOffer. Trong transaction của dispatch, nhóm kết thúc offer, lưu exclusion theo rideId/driverId và cập nhật saga về matching; đồng thời ghi lệnh release và unassign vào outbox. Matching luôn đọc exclusion này, nên D1 không được chọn lại cho R1 dù sau đó available. D1 vẫn có thể phục vụ R2. Nếu không còn tài xế phù hợp thì public ride ở MATCHING và không có assignedDriverId sau khi lệnh unassign được áp dụng.”

**Bằng chứng:** [endOffer](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go); [match](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator.go); [TestRejectionRematchesAndExcludesTheDriverForever](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator_integration_test.go).

**Giới hạn cần nói:** return/release/unassign diễn ra qua message nên không có snapshot đồng thời ở ba DB. Rematch có thể bắt đầu trước khi participant xử lý xong lệnh trước; thứ tự command và recovery là phần cần bảo vệ riêng.

<a id="k4"></a>

### K4 — Accept đúng lúc timeout thì sao?

**Loại:** Kỹ thuật · **Phạm vi:** AC-05, AC-06

**Bối cảnh / giả lập:** Tài xế bấm accept đúng lúc deadline; scheduler cũng đang xử lý offer đó.

**Câu mở đầu:** “Ai quyết định kết quả khi accept và timeout xảy ra gần nhau?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Deadline được đọc theo clock nào?”
2. **Thử thêm một khía cạnh:** “Nếu một transaction chờ lock qua deadline thì contract được hiểu thế nào?”
3. **Cùng phát triển giải pháp:** “Test hiện tại bao phủ race nào và còn thiếu biến thể nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể cùng dựng timeline với accept trước T, đúng T và sau T.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Guard + CAS: chỉ một kết quả offer; đổi lại cần định nghĩa clock/decision time.
- **B.** Chỉ chờ sweeper: ít guard; đổi lại cửa sổ accept quá hạn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Accept và sweeper đều khóa saga trước rồi mới cập nhật offer. Accept chỉ đổi PENDING sang ACCEPTED nếu expires_at còn lớn hơn thời gian DB; sweeper chỉ đổi PENDING sang EXPIRED nếu đã đến hạn. Không có chuyện cùng offer vừa accepted vừa expired. Bên thua đọc lại kết quả: retry accept đã thành công được replay, còn offer hết hạn hoặc đã kết thúc khác thì conflict. Nhóm có test hai nhánh chạy cạnh tranh.”

**Bằng chứng:** [RespondPending/ExpireIfDue](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/adapter/postgres/postgres.go); [Accept/SweepExpired](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go); [TestAcceptRacingTimeoutHasOneWinner](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator_integration_test.go).

**Đào sâu về clock:** PostgreSQL `now()` là thời điểm bắt đầu transaction. Với transaction chờ lock lâu sát deadline, chưa nên khẳng định mọi request bị xử lý sau T đều bị chặn theo thời gian thực. Theo [PostgreSQL về transaction time và clock_timestamp](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT), đây là edge case cần test clock/lock wait riêng; nếu yêu cầu deadline tại thời điểm quyết định, cân nhắc `clock_timestamp()` cùng contract rõ ràng. Test hiện có không chứng minh mọi trường hợp chờ lock.

<a id="k5"></a>

### K5 — Accept trả 200 nhưng GET ride chưa DRIVER_ACCEPTED?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-10

**Bối cảnh / giả lập:** App tài xế báo accept thành công nhưng app khách chưa hiển thị đã có người nhận.

**Câu mở đầu:** “200 từ accept xác nhận điều gì và khách cần chờ điều gì tiếp theo?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Chỗ nào là commit/pivot?”
2. **Thử thêm một khía cạnh:** “Nếu GET còn cũ thì có nên retry accept không?”
3. **Cùng phát triển giải pháp:** “Lúc nào team xem là hệ thống đang kẹt thay vì đang đồng bộ?”

**Hint nếu cần mở cuộc trao đổi:** Có thể phân biệt operation đã được ghi nhận với tất cả view đã hội tụ.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** 200 xác nhận pivot: request ngắn; đổi lại phải giải thích convergence.
- **B.** Chờ mọi participant xác nhận: response dễ hiểu hơn; đổi lại latency và availability phụ thuộc nhiều service.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “200 ở endpoint accept xác nhận dispatch đã commit offer ACCEPTED, tức pivot của saga. Nó chưa có nghĩa driver DB và ride DB cùng đổi trong khoảnh khắc đó. Transaction này ghi cả MarkDriverBusy và MarkAccepted vào outbox. Sau khi consumer áp dụng, GET ride mới phản ánh DRIVER_ACCEPTED. Client nên poll hoặc nhận notification; nếu sau một ngưỡng vẫn chưa hội tụ thì xem saga steps, outbox, consumer lag và DLQ. Nhóm không hứa một con số vài mili giây vì chưa benchmark latency.”

**Bằng chứng:** [Accept](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go); [pivot và eventual consistency](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/adr/ADR-003-saga-orchestration.md).

**Không nói:** “Accept 200 nghĩa là mọi service đã xong.”

<a id="k6"></a>

### K6 — Accept và cancel chạy đồng thời, có bảo đảm chỉ một request thành công?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-06

**Bối cảnh / giả lập:** Khách hủy trong lúc tài xế vừa nhận, hai app có thể cùng thấy thao tác thành công.

**Câu mở đầu:** “Team muốn hai phía hiểu và xử lý tình huống accept/cancel sát nhau thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Có nhất thiết chỉ một API được trả success không?”
2. **Thử thêm một khía cạnh:** “Nếu cả hai commit cục bộ, trạng thái cuối hợp lệ là gì?”
3. **Cùng phát triển giải pháp:** “Bằng chứng nào chứng minh driver được nhả đúng và ride không sống lại?”

**Hint nếu cần mở cuộc trao đổi:** Có thể nhắc đề cho cancel sau accept, rồi bàn quyền quyết định và compensation.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Local decision + bù: service tự chủ; đổi lại có cửa sổ hai kết quả cục bộ cần hòa giải.
- **B.** Một authority cho cả hai: dễ linearize; đổi lại coupling và đường request phụ thuộc chung.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Không có khóa toàn cục giữa hai API ở hai service. Cancel được quyết định tại ride-service; accept commit offer ở dispatch. Vì thế có cửa sổ cả hai API đều thành công cục bộ. Khi RideCancelled hoặc rejection của MarkAccepted tới dispatch, saga bù và nhả tài xế. Điều nhóm cần bảo vệ là ride terminal không sống lại, tài xế được giải phóng đúng ownership, và trạng thái cuối hội tụ. Đây khác với race accept/timeout trong cùng DB, nơi có một người thắng rõ ràng.”

**Bằng chứng:** [cancel/onRejected](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator.go); [terminal guards](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/ride/internal/domain/ride.go); [cancel test](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator_integration_test.go).

**Giới hạn:** test có cancel pending và accept sau cancel, nhưng không thấy bài test end-to-end bắt đầu hai API accept/cancel đồng thời với broker bị delay. Chưa khẳng định mọi interleaving đã được chứng minh. Offer ACCEPTED có thể còn lưu là lịch sử dù saga đã cancelled; retry accept có thể replay kết quả cũ, không có nghĩa ride hiện tại còn accepted. Muốn contract chặt hơn phải làm rõ operation result và GET current state.

**Nếu bị hỏi “vậy là sai?”:** “Đề cho cancel cả sau accept, nên hai action nối tiếp hợp lệ là có thể. Điểm cần demo là không double-book và cuối cùng release đúng. Nếu yêu cầu chỉ một API được thành công trong mọi interleaving thì thiết kế hiện tại chưa cung cấp linearizability xuyên service.”

<a id="k7"></a>

### K7 — Idempotency khác nhau ở API, message và business action?

**Loại:** Kỹ thuật · **Phạm vi:** AC-01, AC-08

**Bối cảnh / giả lập:** Mạng retry HTTP, broker gửi trùng event và workflow gửi lại cùng ý định bằng eventId mới.

**Câu mở đầu:** “Team phân biệt ba loại duplicate này thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Create key bảo vệ điều gì khác inbox eventId?”
2. **Thử thêm một khía cạnh:** “Command có eventId mới nhưng cùng business intent thì lớp nào chặn?”
3. **Cùng phát triển giải pháp:** “Kết quả replay là snapshot hay state hiện tại?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng ba phong bì khác nhau để tách request identity, delivery identity và business identity.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Nhiều lớp dedup/guard: phủ đúng từng dạng trùng; đổi lại tăng dữ liệu và logic.
- **B.** Chỉ dedup eventId: đơn giản; đổi lại không bảo vệ thao tác tương đương mang ID mới.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Ở create API, key và hash request được lưu cùng ride và response snapshot trong một transaction: cùng key/cùng nội dung replay kết quả gốc; nội dung khác thì từ chối. Ở consumer, inbox theo consumer/eventId cùng transaction với xử lý nghiệp vụ và outbox reply; cùng event không áp dụng lại. Ở action như accept, CAS và trạng thái offer bảo vệ cả trường hợp request mới nhưng cùng ý nghĩa nghiệp vụ. Ba lớp này xử lý ba dạng trùng khác nhau.”

**Bằng chứng:** [create use case](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/ride/internal/usecase/rides.go); [idempotency storage](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/ride/internal/adapter/postgres/postgres.go); [Claim/Enqueue](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/pkg/broker/outbox.go); [accept replay](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go).

**Đào sâu:** cùng messageId chỉ giúp dedup transport. Retry/resume có thể tạo eventId mới; participant còn cần business guards. Không dùng “có inbox” làm đáp án cho tất cả stale command hoặc out-of-order.

<a id="k8"></a>

### K8 — Crash ở giữa DB và broker thì sao? Exactly-once chưa?

**Loại:** Kỹ thuật · **Phạm vi:** AC-08, AC-10

**Bối cảnh / giả lập:** Server có thể crash trước/sau DB commit hoặc sau broker nhận nhưng trước khi đánh dấu published.

**Câu mở đầu:** “Team có thể mô phỏng một ride qua các điểm crash đó và nói dữ liệu nào còn lại không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Trước commit có gì được giữ?”
2. **Thử thêm một khía cạnh:** “Publish xong nhưng chưa đánh dấu thì chuyện gì lặp lại?”
3. **Cùng phát triển giải pháp:** “Có nên gọi guarantee này là exactly-once không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể vẽ local transaction state+outbox, rồi lần theo hai crash window.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Outbox + inbox: phục hồi ý định và chịu duplicate; đổi lại relay, retention và các điều kiện offset/order.
- **B.** DB save rồi publish trực tiếp: ít thành phần; đổi lại crash gap cần cơ chế bù.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Ride/state và outbox được ghi cùng local transaction. Crash trước commit thì cả hai chưa tồn tại; commit rồi nhưng chưa publish thì relay còn row để gửi tiếp. Nếu broker đã nhận mà relay chưa đánh published, event có thể được gửi lại. Inbox và state guard xử lý duplicate. Nhóm gọi đây là at-least-once cộng xử lý idempotent, không gọi exactly-once toàn hệ thống.”

**Bằng chứng:** [Enqueue/Relay/Claim](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/pkg/broker/outbox.go); [ADR messaging](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/adr/ADR-004-messaging-outbox-inbox.md).

**Giới hạn:** bảo đảm còn phụ thuộc offset, DLQ publish thành công, thứ tự command và recovery. Xem K10/K11/K12; không nói “có outbox nên không thể mất message ở bất cứ đâu”.

<a id="k9"></a>

### K9 — Redis cũ: chống trùng tài xế có đồng nghĩa matching luôn đúng?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-03, AC-04, AC-09

**Bối cảnh / giả lập:** Một xe vẫn available nhưng đã đi xa; Redis còn tọa độ cũ.

**Câu mở đầu:** “Team đang bảo đảm không trùng xe hay còn bảo đảm vị trí đủ mới để offer đúng?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Driver DB recheck status có kiểm tra lại vị trí không?”
2. **Thử thêm một khía cạnh:** “Version xử lý out-of-order khác gì projection lag?”
3. **Cùng phát triển giải pháp:** “Nếu cần nâng freshness, revalidate ứng viên có đủ để bảo đảm nearest toàn cục không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách safety của ownership khỏi chất lượng/thời điểm snapshot matching.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Projection nhanh: giảm query load; đổi lại có lag và stale candidate.
- **B.** Authoritative validation: giảm stale eligibility; đổi lại thêm I/O, còn snapshot toàn cục là vấn đề khác.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Redis là read model tìm ứng viên. Nếu Redis vẫn nghĩ D1 available nhưng DB đã offered/busy, reservation ở PostgreSQL sẽ thất bại, nên không double-book. Tuy nhiên nếu D1 vẫn available nhưng vị trí đã đổi, reservation hiện không kiểm tra lại tọa độ hoặc version vị trí. Vì vậy nhóm bảo đảm exclusivity mạnh hơn độ mới của matching: version chặn event cũ ghi đè, không làm mất độ trễ projection. Đây là giới hạn cần nêu với AC-03/04.”

**Bằng chứng:** [versioned GEO](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/adapter/redis/redis.go); [Projection](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/projection.go); [reservation không guard vị trí](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/driver/internal/adapter/postgres/postgres.go).

**Nếu hỏi “sửa thế nào?”:** “Thêm projection lag/freshness signal; mang expected location version để revalidate và chọn lại nếu đã thay đổi; hoặc đọc authoritative candidate trước commit. Việc revalidate D1 còn trong radius vẫn chưa tự chứng minh D1 là gần nhất trong tất cả tài xế khi dữ liệu đang đổi, nên phải định nghĩa snapshot/độ mới chấp nhận được. Đây là đề xuất, chưa có trong code.”

<a id="k10"></a>

### K10 — Redis mất dữ liệu có tự rebuild liên tục không?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-10; recovery

**Bối cảnh / giả lập:** Redis bị mất index giữa ca; driver DB vẫn còn tài xế available.

**Câu mở đầu:** “Team khôi phục khả năng tìm xe cho khách như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Bootstrap chạy khi nào và có tiếp tục kiểm tra sau startup không?”
2. **Thử thêm một khía cạnh:** “Tài xế không phát update mới có tự xuất hiện lại không?”
3. **Cùng phát triển giải pháp:** “Khi dữ liệu chỉ mất một phần, kiểm tra non-empty có đủ không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể phân biệt startup bootstrap, manual rebuild và periodic reconciliation.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Rebuild manual/startup: dễ làm và ít job; đổi lại cần thao tác hoặc restart khi mất runtime/partial data.
- **B.** Periodic reconciliation: tự phát hiện lệch lâu; đổi lại thêm tải, snapshot/pagination và race với event stream.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Hiện có Rebuild từ danh sách driver và bootstrap RebuildIfEmpty khi dispatch khởi động; có endpoint nội bộ và make rebuild-geo để chạy thủ công. Nhưng bootstrap kết thúc sau lần thành công, không phải job reconciliation liên tục. Nếu Redis mất toàn bộ dữ liệu khi dispatch vẫn sống, event mới chỉ khôi phục tài xế có thay đổi; driver không phát event có thể thiếu trong index cho tới khi rebuild. Redis lỗi khiến saga chờ và retry, không có fallback query DB ngay trong matching.”

**Bằng chứng:** [RebuildIfEmpty](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/projection.go); [geo bootstrap](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/cmd/main.go); [geo failure → wait](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator.go); [rebuild-geo](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/Makefile).

**Đề xuất:** periodic reconciliation, explicit recovery trigger, kiểm tra completeness thay vì chỉ số phần tử >0. Rebuild hiện ListDrivers toàn bộ, nên khi lớn phải pagination/snapshot và xử lý event đồng thời. Không gọi Redis trong bài này là cache có fallback DB đầy đủ.

<a id="k11"></a>

### K11 — Message xử lý lỗi, rồi gửi DLQ cũng lỗi?

**Loại:** Kỹ thuật · **Phạm vi:** AC-10; correctness gap

**Bối cảnh / giả lập:** Message lỗi nhiều lần, rồi broker cũng không nhận bản gửi sang DLQ.

**Câu mở đầu:** “Làm sao biết message chưa giải quyết sẽ không bị bỏ qua khi consumer commit offset?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Nếu toDLQ fail, caller nhận tín hiệu gì?”
2. **Thử thêm một khía cạnh:** “Commit có thể vượt một failed record trong cùng partition không?”
3. **Cùng phát triển giải pháp:** “Fault-injection test nào cần có trước khi khẳng định không mất message?”

**Hint nếu cần mở cuộc trao đổi:** Có thể lần theo một record và offset từ handler fail đến DLQ ack rồi commit.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Chỉ commit sau business success hoặc DLQ ack: an toàn hơn; đổi lại có thể chặn partition và cần vận hành.
- **B.** Log DLQ error rồi commit tiếp: giữ queue chạy nhưng có nguy cơ bỏ mất công việc chưa lưu an toàn.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Hiện consumer retry tối đa năm lần rồi gọi toDLQ. Mình cần nói rõ một gap: toDLQ chỉ log nếu publish thất bại, không trả lỗi để ngăn commit offset; vòng Run vẫn commit sau batch. Nên không thể khẳng định failed record luôn được giữ an toàn trong DLQ. Sửa ưu tiên là chỉ đánh dấu record đã xử lý sau business commit hoặc DLQ được broker xác nhận, và không commit vượt record thất bại trong cùng partition.”

**Bằng chứng:** [process/toDLQ/Run](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/pkg/broker/consumer.go).

**Khi hỏi test:** “Hiện chưa có automated broker-failure injection cho nhánh này. Test cần ép handler fail, ép DLQ producer fail, restart consumer và chứng minh record được nhận lại; đồng thời có record sau nó để kiểm tra không commit vượt.”

**Lưu ý:** đây là kết luận từ control flow code, chưa tái hiện outage runtime. Không nói test integration pass nghĩa là nhánh này đã được chứng minh.

<a id="k12"></a>

### K12 — Sau pivot, ‘retry until done’ đã thật sự đầy đủ chưa?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** AC-05, AC-10

**Bối cảnh / giả lập:** Offer đã accepted nhưng một participant không cập nhật, hoặc cancel đã xong nhưng release vào DLQ.

**Câu mở đầu:** “Team phát hiện và giúp một saga chưa hội tụ đi tiếp thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Retry transport và retry workflow khác nhau ở đâu?”
2. **Thử thêm một khía cạnh:** “Query retrier hiện lấy những saga status nào?”
3. **Cùng phát triển giải pháp:** “Có bước xác minh ack cuối của từng participant không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể coi accepted là pivot chứ chưa phải mọi bước sau đều hoàn tất.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Participant ack + reconciliation: nhìn được phần còn thiếu; đổi lại thêm state và retry policy.
- **B.** Chỉ transport retry/DLQ: ít workflow state; đổi lại cần manual recovery khi retry hết.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Nhóm có relay retry row chưa publish, consumer retry rồi DLQ, và saga retry/resume cho STARTED, RESERVING, MATCHING, WAITING_FOR_DRIVER. Nhưng query DueForRetry không chọn ACCEPTED, CANCELLED hoặc COMPLETED. Nếu MarkDriverBusy, MarkAccepted hoặc ReleaseDriver đã rơi vào DLQ thì không có workflow-level job tự xác minh và gửi lại toàn bộ các bước đó. Khi ấy cần replay và điều tra. ADR nói các bước sau pivot retriable là ý đồ thiết kế; code recovery hiện chưa bao phủ trọn ý đó.”

**Bằng chứng:** [DueForRetry](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/adapter/postgres/postgres.go); [RetryAndResume](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go); [retriable steps](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/adr/ADR-003-saga-orchestration.md); [manual replay](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/scripts/replay-dlq.sh).

**Đề xuất:** lưu trạng thái/ack riêng từng participant, reconciliation các saga chưa hội tụ, retry command idempotent và alert stuck age. Kiểm chứng bằng crash/replay ở từng bước; không chỉ kiểm tra saga có status ACCEPTED.

<a id="k13"></a>

### K13 — Cùng Kafka key đã bảo đảm thứ tự khi nhiều relay?

**Loại:** Kỹ thuật · **Phạm vi:** AC-10; scalability

**Bối cảnh / giả lập:** Hai replica relay lấy hai batch của cùng aggregate; batch sau tới broker trước.

**Câu mở đầu:** “Kafka key và outbox relay chia nhau trách nhiệm giữ thứ tự thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Broker giữ thứ tự nhận hay thứ tự DB commit?”
2. **Thử thêm một khía cạnh:** “Version guard của projection có bảo vệ cả command nghiệp vụ không?”
3. **Cùng phát triển giải pháp:** “Muốn scale relay, team chọn single leader, ownership theo key hay CDC?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dựng hai command unassign/assign và đổi thứ tự đến để nhìn hậu quả.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Single publisher/owner per key: ordering dễ bảo vệ; đổi lại bottleneck/failover.
- **B.** Parallel relay không ownership: throughput tốt hơn nhưng có nguy cơ đảo thứ tự cần cơ chế bù.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Key đưa message vào cùng partition, nhưng thứ tự là thứ tự broker nhận, không tự sửa thứ tự publish trước đó. Relay dùng SKIP LOCKED cho phép nhiều replica lấy các batch khác nhau; batch sau có thể tới broker trước batch trước. Tài liệu scalability đã ghi relay ordering là giới hạn khi scale nhiều instance. Driver projection có version guard, còn các command nghiệp vụ không phải tất cả đều chống mọi đảo thứ tự. Cần single publisher/leader, ownership theo key hoặc CDC giữ thứ tự rồi test reordering.”

**Bằng chứng:** [Relay.flush](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/pkg/broker/outbox.go); [S3 ordering limitation](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/scalability.md); [state/offer guards](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/ride/internal/domain/ride.go).

**Tình huống cụ thể cần nhớ:** unassign offer cũ và assign offer mới phải tới ride theo thứ tự đúng. Guard offerId giúp bỏ lệnh cũ, nhưng không thay thế một cơ chế phục hồi mọi command đến quá sớm.

<a id="k14"></a>

### K14 — 1 triệu tài xế có chạy được chưa?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** Scalability; chưa benchmark

**Bối cảnh / giả lập:** Đội xe tăng từ 1.000 đến một triệu, phần location traffic tăng khác ride traffic.

**Câu mở đầu:** “Team ưu tiên scale đường dữ liệu nào đầu tiên và dựa trên giả định gì?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Con số update/giây là load model hay benchmark?”
2. **Thử thêm một khía cạnh:** “Ba bottleneck nào cần đo trước?”
3. **Cùng phát triển giải pháp:** “Mỗi chiến lược scale làm tăng chi phí hoặc độ trễ ở đâu?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ drivers × tần suất gửi GPS, không từ số service.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Location stream/sharding: giảm áp lực điểm tập trung; đổi lại ordering, ranh giới vùng và recovery.
- **B.** Giữ một stack đến khi đo được nút thắt: đơn giản; đổi lại có trần cần kế hoạch thay đổi.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Chưa có benchmark chứng minh mức đó. Con số một triệu là lộ trình thiết kế. Nếu một triệu tài xế đều gửi vị trí mỗi bốn giây thì riêng location đã khoảng 250 nghìn update/giây; đây là giả định tải, không phải throughput đo được. Ba bottleneck đáng chú ý là write amplification Postgres/outbox, một GEO key và contention ở điểm nóng. Hướng phát triển là location stream/snapshot, chia GEO theo địa lý và area-owned hoặc batch dispatch. Đổi lại có stale data, ranh giới khu vực và thêm latency.”

**Bằng chứng:** [load model, bottlenecks, trade-offs](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/scalability.md).

**Nếu hỏi “đã có gRPC thì hết write load chưa?”:** “Chưa. gRPC stream đã có nhưng đường lưu vị trí hiện vẫn ghi DB và outbox cho mỗi update. Giảm số kết nối/request không đồng nghĩa bỏ write amplification.”

<a id="k15"></a>

### K15 — Điều tra ‘R001 không tìm được tài xế’ như thế nào?

**Loại:** Nghiệp vụ → kỹ thuật · **Phạm vi:** Observability

**Bối cảnh / giả lập:** Support chỉ có rideId và khách nói đang chờ quá lâu.

**Câu mở đầu:** “Team sẽ điều tra trong một phút theo thứ tự nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Đâu là no-candidate, đâu là Redis lỗi hay command chưa có reply?”
2. **Thử thêm một khía cạnh:** “Log cần nối ride, event, offer và driver ra sao?”
3. **Cùng phát triển giải pháp:** “Log success trước rollback có thể khiến người trực hiểu sai không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể bắt đầu từ state có thẩm quyền, rồi dùng log/trace giải thích đường đi.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Correlated logs + saga view: sát nhu cầu điều tra; đổi lại phải giữ context và tránh coi log là commit proof.
- **B.** Chỉ metrics tổng: dễ quan sát xu hướng; đổi lại không giải thích được một ride cụ thể.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Bắt đầu từ GET ride và dispatch view, xem saga status, offer/exclusion và saga_steps. Theo rideId trong log để nối eventId, driverId, offerId và causationId; sau đó kiểm tra outbox backlog, consumer lag và DLQ. Phân biệt MATCHING vì thật sự không có tài xế với đang WAITING vì Redis lỗi hoặc command không có reply. Traces giúp nối các bước; DB/state vẫn là nguồn sự thật khi log success có thể đã phát trước transaction commit.”

**Bằng chứng:** [Describe](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/offers.go); [observability](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/observability.md); [step logging](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator.go); [log trong transaction](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/pkg/broker/outbox.go).

**Đào sâu:** metrics/logs trong transaction có thể đã emit dù sau đó rollback. Vì thế không coi counters/audit-looking logs là bằng chứng transaction đã commit. Mốc latency và counter cũng phải hiểu theo instrumentation hiện có.

<a id="k16"></a>

### K16 — Chọn gần nhất và tie-break có thật sự nhất quán?

**Loại:** Kỹ thuật · **Phạm vi:** AC-04

**Bối cảnh / giả lập:** Hai xe cách đều, một xe ở biên 2 km, hoặc vùng có nhiều ứng viên cùng khoảng cách.

**Câu mở đầu:** “Team giữ lựa chọn nearest và tie-break nhất quán giữa Redis với domain ra sao?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Redis shortlist và Haversine final check làm hai việc gì?”
2. **Thử thêm một khía cạnh:** “Khi cắt candidate list, có thể bỏ mất tie hoặc nearest theo tọa độ chính xác không?”
3. **Cùng phát triển giải pháp:** “Geographic edge case nào vượt khả năng Redis GEO dù validator nhận tọa độ?”

**Hint nếu cần mở cuộc trao đổi:** Có thể demo cùng tọa độ trước, rồi mới bàn limit shortlist và gần cực như test bổ sung.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Shortlist + rank trong domain: nhanh và testable; đổi lại cần chứng minh shortlist không bỏ ứng viên cần thiết.
- **B.** Đọc toàn bộ ứng viên authoritative: dễ lập luận hơn ở quy mô nhỏ; đổi lại query/CPU và freshness vẫn cần contract.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Phần KVP luyện trả lời và mở bằng chứng khi cần:**

**Trả lời mẫu:**

> “Redis shortlist ứng viên, Go tính lại Haversine theo tọa độ lưu trong projection và loại ngoài radius, không chỉ lấy thứ tự Redis. Rank theo distance rồi driverId nên hai tài xế cùng tọa độ có kết quả ổn định. Có unit test nearest, radius và equidistant. Code mở rộng số candidate để tránh cắt một nhóm đồng hạng, nhưng có ngưỡng dừng; ở mật độ cực lớn vẫn cần test coverage của shortlist. Theo [tài liệu GEOADD chính thức](https://redis.io/docs/latest/commands/geoadd/), Redis GEO có giới hạn vĩ độ khoảng ±85,05°, trong khi đề nhận ±90°: đó là edge case địa lý cần ghi nhận, không khẳng định hỗ trợ toàn bộ trái đất chỉ vì validator cho phép.”

**Bằng chứng:** [Rank](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/domain/match.go); [matching tests](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/domain/match_test.go); [candidate expansion](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/orchestrator.go); [GEOADD/GEOSEARCH](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/adapter/redis/redis.go).

**Đề xuất kiểm chứng:** cùng tọa độ nhưng driverId đảo thứ tự; biên 2 km; pickup/driver sát cực; mật độ hơn ngưỡng shortlist. Đây là edge cases bổ sung, không phải load test đã chạy.

<a id="k17"></a>

### K17 — Gần theo đường chim bay có phải đón nhanh nhất?

**Loại:** Nghiệp vụ · **Phạm vi:** AC-04; ETA ngoài scope

**Bối cảnh / giả lập:** D1 ở bên kia sông cách 500 m, D2 cùng phía cách 900 m nhưng đường đi ngắn hơn.

**Câu mở đầu:** “Vì sao nhóm chọn nearest theo Haversine, và nếu khách quan tâm thời gian đón thì thiết kế thay đổi ở đâu?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Đây là mục tiêu của đề hay tối ưu sản phẩm thật?”
2. **Thử thêm một khía cạnh:** “Nếu dùng ETA, phụ thuộc routing nào cần tính tới?”
3. **Cùng phát triển giải pháp:** “Team sẽ so chất lượng matching bằng chỉ số nào trước khi đổi thuật toán?”

**Hint nếu cần mở cuộc trao đổi:** Có thể đồng ý Haversine đúng đề rồi cùng bàn ETA như một yêu cầu khác.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Haversine: tự tính, deterministic, đúng scope; đổi lại không phản ánh cầu/đường/traffic.
- **B.** ETA routing: gần kỳ vọng đón xe hơn; đổi lại dịch vụ bản đồ, latency, chi phí và fallback.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Nhóm chọn Haversine vì đề yêu cầu nearest trong radius và nêu đây là cách tính đủ dùng. Nhóm không diễn giải khoảng cách đó thành ETA thực tế. Nếu mở rộng theo thời gian đón, sẽ giữ spatial shortlist rồi rank bằng routing ETA, có deadline/fallback khi routing lỗi. Đó là thay đổi policy cần đo chất lượng và thảo luận lại acceptance, chưa nằm trong code.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/domain/match.go).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k18"></a>

### K18 — Không có xe: khách chờ bao lâu và thấy gì?

**Loại:** Nghiệp vụ · **Phạm vi:** AC-04, AC-07; UX policy mở rộng

**Bối cảnh / giả lập:** Một khách ở vùng thưa tài xế; tất cả ứng viên đã reject hoặc ngoài radius.

**Câu mở đầu:** “Khi chưa có xe, team muốn khách hiểu và chủ động được điều gì?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “WAITING_FOR_DRIVER trong saga có khác public MATCHING không?”
2. **Thử thêm một khía cạnh:** “Điều gì khiến ride được tìm lại khi có xe mới?”
3. **Cùng phát triển giải pháp:** “Nếu muốn tự mở radius hoặc tự hủy sau N phút, đó có phải behavior hiện tại không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể giữ trạng thái đúng đề trước rồi bàn chính sách chờ và thông báo sản phẩm.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Giữ MATCHING + retry: đúng trạng thái đề và có cơ hội tìm lại; đổi lại khách có thể chờ lâu nếu không có UX deadline.
- **B.** Thêm policy timeout/mở radius: giúp kỳ vọng rõ hơn; đổi lại phải định nghĩa contract mới và không tự gán là AC.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Public ride vẫn MATCHING khi không có xe; WAITING_FOR_DRIVER là trạng thái điều phối nội bộ để hẹn thử lại, không thêm một public ride state ngoài đề. Retrier có interval và có wake khi nhận status AVAILABLE. Location update riêng không gọi OnAvailable trong Projection.Apply, nên không nên hứa mọi update đều đánh thức ngay; periodic retry vẫn là đường thử lại. Auto-cancel hoặc mở radius theo thời gian là policy tương lai, chưa có.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/usecase/projection.go).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k19"></a>

### K19 — Retry một lần đặt và chủ động đặt chuyến mới

**Loại:** Nghiệp vụ · **Phạm vi:** AC-01, AC-08

**Bối cảnh / giả lập:** Khách không chắc request trước thành công; một lúc sau lại muốn thực sự đặt chuyến khác cùng điểm đón.

**Câu mở đầu:** “Client phân biệt retry cùng chuyến với một ý định đặt mới như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Idempotency-Key do ai tạo và giữ trong bao lâu?”
2. **Thử thêm một khía cạnh:** “Cùng key nhưng đổi destination thì server làm gì?”
3. **Cùng phát triển giải pháp:** “Hệ thống có rule cấm một passenger tạo hai ride với hai key khác nhau không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể phân biệt identity của thao tác với tính giống nhau của nội dung.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Key cho từng ý định: retry an toàn và vẫn cho phép chuyến mới; đổi lại client quản lý lifecycle key.
- **B.** Dedup chỉ theo passenger/body: dễ giảm trùng tình cờ; đổi lại có thể chặn chuyến mới hợp lệ và thay contract.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Cùng ý định đặt thì client giữ cùng key qua retry; server canonicalize các trường và so hash. Cùng key khác request bị từ chối. Ý định đặt mới dùng key mới. Code hiện không có invariant một passenger chỉ được một active ride, nên hai key khác nhau có thể tạo hai ride; đó không phải điều idempotency-key hứa ngăn và đề cũng không yêu cầu rule này. Nếu sản phẩm cần, phải bổ sung invariant riêng tại ride owner.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/ride/internal/usecase/rides.go).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k20"></a>

### K20 — GPS cũ tới server sau GPS mới

**Loại:** Kỹ thuật · **Phạm vi:** AC-03; technical extension

**Bối cảnh / giả lập:** Điện thoại reconnect và gửi lại mẫu vị trí cũ qua stream khác; seq từ client không nhất thiết cùng thứ tự arrival.

**Câu mở đầu:** “Version hiện tại bảo vệ thứ tự event trong hệ thống hay cả thứ tự mẫu GPS được đo ở điện thoại?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “seq trong LocationUpdate đang được dùng để ack hay để từ chối mẫu cũ?”
2. **Thử thêm một khía cạnh:** “Hai connection cho cùng driver có thể làm location lùi theo thời điểm đo không?”
3. **Cùng phát triển giải pháp:** “Nếu thêm device sequence và session, cần xử lý reset sequence thế nào?”

**Hint nếu cần mở cuộc trao đổi:** Có thể tách event version của DB khỏi observation time/sequence ở nguồn.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Server arrival order + version: đơn giản và chặn event broker cũ ghi đè; đổi lại không biết mẫu GPS nào được đo mới nhất.
- **B.** Device/session sequence hoặc timestamp policy: phát hiện mẫu đến muộn; đổi lại reconnect/reset, clock skew và nhiều thiết bị.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Driver DB tăng version mỗi lần UpdateLocation được áp dụng. Projection dùng version đó để không nhận event DB cũ. Nhưng gRPC adapter hiện chỉ copy seq vào ack, không dùng seq để reject mẫu trễ và không lưu observation timestamp từ thiết bị. Vì thế không nên nói đã chống mọi out-of-order GPS từ client; hiện thứ tự tiếp nhận thành công ở server quyết định version. Hướng cải tiến là device/session identity và monotonic sequence có policy reset, test hai stream interleaving.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/driver/internal/adapter/grpc/grpc.go).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k21"></a>

### K21 — Push offer bằng gRPC đã bỏ hết polling chưa?

**Loại:** Kỹ thuật · **Phạm vi:** API v2; scalability

**Bối cảnh / giả lập:** Nhiều tài xế giữ stream WatchOffers mở; mỗi tài xế cần thấy offer đúng lúc.

**Câu mở đầu:** “gRPC stream hiện giảm phần polling nào, và tải DB bên trong còn như thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Mỗi stream kiểm tra pending offer theo interval nào?”
2. **Thử thêm một khía cạnh:** “Nếu có N stream thì số read/giây xấp xỉ bao nhiêu theo interval?”
3. **Cùng phát triển giải pháp:** “Reconnect có replay toàn lịch sử hay chỉ tìm pending offer hiện tại?”

**Hint nếu cần mở cuộc trao đổi:** Có thể nói rõ lợi ích mạng riêng với lợi ích load DB; cả hai không tự bằng nhau.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Server stream + internal polling: code gọn, bỏ request rỗng từ client; đổi lại còn read theo số stream và khoảng poll.
- **B.** Event-driven fan-out: giảm truy vấn lặp; đổi lại routing connection, reconnect/resync, backpressure và nhiều replica.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Stream loại client polling HTTP nhưng mỗi stream vẫn gọi PendingOffer theo interval, mặc định 500 ms ở main. Về xấp xỉ, N stream tạo khoảng N/0,5 read mỗi giây khi mọi stream hoạt động theo cấu hình đó; đây là mô hình đếm chứ chưa đo throughput. Reconnect bắt đầu bằng đọc pending hiện tại, không có durable resume cursor để replay toàn lịch sử. Event-driven fan-out và cơ chế resync là hướng tiếp theo, chưa được triển khai.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/services/dispatch/internal/adapter/grpc/grpc.go).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k22"></a>

### K22 — Test nào chứng minh được đúng lớp rủi ro?

**Loại:** Kỹ thuật · **Phạm vi:** Testing; AC-09, AC-10

**Bối cảnh / giả lập:** Người nghe thấy nhiều test pass và muốn biết DB, saga và broker đã được kiểm tra đến đâu.

**Câu mở đầu:** “Team có thể chọn một test cho rule, một cho race DB và một cho luồng xuyên service không?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Saga integration có dùng broker thật không?”
2. **Thử thêm một khía cạnh:** “Lần chuẩn bị Q&A này đã thực thi suite nào?”
3. **Cùng phát triển giải pháp:** “Failure case nào quan trọng nhất hiện chưa được automated proof?”

**Hint nếu cần mở cuộc trao đổi:** Có thể trả lời theo lớp rủi ro được chứng minh, không theo tổng số test.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Unit + DB integration: nhanh và chỉ đúng cơ chế; đổi lại chưa chứng minh broker/network thật.
- **B.** E2E + fault injection: gần failure path thực; đổi lại môi trường nặng và cần kiểm soát thời gian/trạng thái.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Rule matching/state có unit tests. Driver reservation và saga có integration với PostgreSQL thật; saga test dùng participant mô phỏng, không phải broker thật. Lần rà soát này đã chạy go test ./... và make test-int thành công; chưa chạy e2e/fault injection broker. Test e2e có trong repo nhưng đó là bằng chứng code test tồn tại, không được gộp thành đã pass trong lần kiểm tra này. Ưu tiên bổ sung thử lỗi DLQ/offset và reconciliation sau pivot.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/testing.md).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k23"></a>

### K23 — Đổi retention có làm mất idempotency?

**Loại:** Kỹ thuật · **Phạm vi:** AC-08, AC-10; housekeeping

**Bối cảnh / giả lập:** Hệ thống chạy lâu; outbox, inbox và idempotency record tăng dần.

**Câu mở đầu:** “Nhóm muốn giữ những dữ liệu chống trùng này trong bao lâu, và retry sau thời hạn sẽ được xử lý thế nào?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Xóa inbox khi broker còn có thể replay event cũ thì có tác động gì?”
2. **Thử thêm một khía cạnh:** “Key create hết hạn có còn được hứa trả ride cũ không?”
3. **Cùng phát triển giải pháp:** “Cleanup có được xóa unpublished outbox hoặc saga chưa hoàn tất không?”

**Hint nếu cần mở cuộc trao đổi:** Có thể chọn retention từ cửa sổ replay/retry và contract, thay vì chỉ theo mục tiêu giảm dung lượng.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Giữ lâu: replay an toàn và dễ điều tra hơn; đổi lại storage/index/lookup tăng.
- **B.** Retention có contract: kiểm soát dữ liệu; đổi lại dedup guarantee có thời hạn và cleanup phải bảo vệ unfinished work.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Hiện docs ghi chưa có cleanup job cho inbox, published outbox và idempotency key; không nên nói TTL đã có. Hướng phát triển là định nghĩa retry/replay window trước, giữ inbox phù hợp cửa sổ delivery/replay được hỗ trợ và xử lý trường hợp replay ngoài cửa sổ. Không xóa outbox chưa published hoặc evidence saga đang cần. Create-key expiry cũng phải là contract public rõ; xóa record tùy ý có thể biến retry cũ thành chuyến mới.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/adr/ADR-004-messaging-outbox-inbox.md).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.

<a id="k24"></a>

### K24 — Nếu chỉ có thêm một ngày, nhóm cải tiến gì trước?

**Loại:** Nghiệp vụ · **Phạm vi:** Product prioritization; đề xuất cho tương lai

**Bối cảnh / giả lập:** Sản phẩm chuẩn bị cho một nhóm người dùng nhỏ, nguồn lực không đủ làm mọi ý tưởng scale.

**Câu mở đầu:** “Team chọn ba việc tiếp theo thế nào dựa trên tác động tới khách và độ tin cậy?”

**Các nhánh hỏi tiếp — chọn một:**

1. **Làm rõ hiện tại:** “Một lỗi khiến công việc bị mất có ưu tiên hơn tối ưu throughput chưa đo không?”
2. **Thử thêm một khía cạnh:** “Team cần test nào để biết sửa đã hiệu quả?”
3. **Cùng phát triển giải pháp:** “Phần nào được chủ động để sau vì chưa có nhu cầu/benchmark?”

**Hint nếu cần mở cuộc trao đổi:** Có thể dùng tác động, khả năng quan sát và bằng chứng, thay vì độ hấp dẫn của công nghệ.

**Hai hướng để so sánh ưu/nhược điểm:**

- **A.** Ưu tiên correctness/recovery: giảm chuyến kẹt và sai trạng thái; đổi lại ít tính năng/benchmark mới để trình diễn.
- **B.** Ưu tiên scale/tính năng trước: có thêm khả năng demo; đổi lại giữ lại failure gap đang biết và khó vận hành.

**Chốt cuộc trao đổi:** “Trong bối cảnh nào team giữ lựa chọn hiện tại, và dấu hiệu nào khiến team muốn đổi?”

**Trả lời mẫu 45–60 giây:**

> Nếu ưu tiên vận hành nhóm nhỏ, nhóm sẽ xử lý DLQ failure không được commit vượt trước, tiếp theo làm rõ/kiểm chứng recovery sau pivot và ordering khi nhiều relay. Mỗi việc đi kèm failure scenario và assertion state cuối, không chỉ thêm code. Location freshness/rebuild là nhóm tiếp theo tùy tác động demo. Scale lớn và ETA để sau khi có mục tiêu và dữ liệu đo. Đây là đề xuất ưu tiên cải tiến, không phải sửa đã hoàn tất hoặc commit thuộc bài nộp.

**Bằng chứng / điểm xuất phát:** [Code hoặc tài liệu snapshot](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/blob/a843c0234216db5e7ad172a7c6ed4ad712616028/coding-challenge-3/kvp/docs/testing.md).

**Giới hạn:** phân biệt hành vi hiện có với hướng cải tiến; nếu chưa có test thì không gọi là đã chứng minh.


## KVP — cách trả lời, tình huống demo và giới hạn đã kiểm tra

**Mẫu trả lời:** “Bối cảnh này nhóm đang ưu tiên X. Hiện Y quyết định bằng Z. Test/đoạn code A chứng minh phạm vi B. Chưa bảo đảm C; nếu cần C, nhóm sẽ cân nhắc D với chi phí E.”

**Mở đầu 30 giây:**

> Nhóm tách quyền quyết định: ride-service giữ lifecycle, driver-service quyết định quyền giữ tài xế, dispatch-service giữ offer và saga. Redis giúp tìm ứng viên, PostgreSQL quyết định claim. Bài học chính là bảo vệ invariant giữa các bước bất đồng bộ, cùng với việc nói rõ phần nào được bảo đảm ngay và phần nào cần hội tụ.

### Những cách diễn đạt nên điều chỉnh

| Tránh nói | Cách nói có cơ sở hơn |
|---|---|
| “Đề bắt microservices/saga.” | “Đây là mục tiêu học tập của team; đề cho monolith.” |
| “Redis cũ chỉ gây thất bại reservation, không thể matching sai.” | “CAS giữ exclusivity; location freshness là giới hạn riêng.” |
| “Có outbox/inbox là exactly-once.” | “At-least-once với dedup và business guards, trong các điều kiện đã nêu.” |
| “Accept/cancel luôn chỉ một API thành công.” | “Hai commit cục bộ; cần compensation và hội tụ.” |
| “Sau pivot retry mãi đến thành công.” | “Transport retry hữu hạn và DLQ; reconciliation sau pivot chưa đầy đủ.” |
| “Cùng key Kafka luôn giữ đúng thứ tự.” | “Cần giữ thứ tự trước publish và trong partition.” |
| “Đã chạy 1 triệu tài xế.” | “Mới có load model và hướng scale; chưa benchmark.” |
| “Integration test pass là broker failure đã được test.” | “Saga test dùng DB thật và participant mô phỏng; chưa fault-inject broker.” |

### Kịch bản luyện tập và bằng chứng nên mở sẵn

Các bước dưới đây để rehearsal/demo; không phải tất cả đã được thực thi trong lần rà soát. Chạy ở môi trường demo riêng và dùng dữ liệu mới, không reset stack đang dùng chung.

| # | Thiết lập / thao tác | Kết quả cần chứng minh | Bằng chứng hiện có / còn thiếu |
|---|---|---|---|
| S1 | Cùng key/body, gửi 10 request đồng thời; retry sau complete | Một ride, một creation; replay response gốc; đổi body bị từ chối | Integration create concurrent/response snapshot; đã chạy suite |
| S2 | Chỉ D1 available; tạo R1/R2 cùng lúc | Tối đa một ride giữ D1; ride kia matching hoặc dùng D2 | Driver CAS và saga integration đã chạy; gateway e2e chưa chạy lần này |
| S3 | D1 gần hơn D2; D1 reject, sau đó available lại | R1 sang D2, không quay lại D1; D1 còn phục vụ R2 | Exclusion integration đã chạy |
| S4 | D1 không trả lời trong timeout | Offer expired, release/unassign, rematch; clear assignedDriverId sau hội tụ | Timeout integration đã chạy; e2e timeout chưa chạy lần này |
| S5 | Accept và sweep cùng lúc | Offer có đúng một outcome, không accepted + expired | Race integration đã chạy; lock-wait deadline edge chưa có proof |
| S6 | Cancel đang pending; sau đó accept cũ | Ride terminal; tài xế được nhả; accept cũ không tạo ride mới | Cancel integration đã chạy |
| S7 | Hai API accept/cancel đồng thời; delay từng topic | Ghi lại response từng API và state cuối; không double-book; release đúng | Cần test E2E/fault injection riêng; không gọi đây là đã pass |
| S8 | Location đã ghi DB nhưng pause projection rồi tạo ride | Chỉ ra matching đang dùng tọa độ nào; không đánh đồng CAS với freshness | Version/out-of-order integration có; read-after-write scenario còn thiếu |
| S9 | Redis mất dữ liệu khi dispatch vẫn sống | Nhận diện mất index; rebuild; tài xế không phát event vẫn xuất hiện lại | Code có manual rebuild; cần recovery drill riêng |
| S10 | Handler fail, DLQ publish cũng fail, sau đó restart | Record chưa giải quyết phải được redeliver, không commit vượt | Gap K11: chưa có proof, cần sửa và fault-inject |
| S11 | MarkAccepted/Release vào DLQ | Alert stuck; replay an toàn; state cuối hội tụ | Gap K12: manual replay có, automatic reconciliation chưa đủ |
| S12 | Hai dispatch replica publish batch khác nhau cho cùng key | Không đảo lệnh unassign/assign; nếu đảo phải recovery đúng | Gap K13: cần kiểm chứng/sửa ordering trước khi khẳng định replica-safe toàn bộ |

Mở sẵn: ADR-002, `ReserveIfAvailable`, `RespondPending`, test concurrency, `endOffer`, `DueForRetry`, `Consumer.toDLQ`, `Relay.flush`, `Projection.RebuildIfEmpty`, requirements traceability. Một người giải thích, một người chỉ đúng bằng chứng; tránh ba người cùng trả lời.

### Ưu tiên chuẩn bị tối nay

1. **Bắt buộc thuộc:** K2/K4/K6/K7/K8/K9 và sơ đồ quyền quyết định của ba service.
2. **Chuẩn bị nhận giới hạn:** K11 (DLQ/offset), K12 (recovery sau pivot), K13 (ordering nhiều relay), K10 (rebuild runtime). Đây là chỗ không nên ứng biến bằng “eventual consistency sẽ tự sửa”.
3. **Nếu chỉ có 30 phút:** 5 phút nhắc AC; 10 phút diễn tập K2/K6/K9; 10 phút mở code K11/K12/K13; 5 phút tập kết luận dưới 60 giây.
4. **Nếu có một giờ thêm:** bổ sung test chứng minh một failure case trước, ưu tiên DLQ thất bại không được commit offset. Đây chỉ là đề xuất; lần rà soát này không sửa bài. README có quy định chấm theo commit trước deadline, nên phần sửa sau phải ghi rõ là cải tiến sau bài nộp.

Kết thúc khi gặp giới hạn:

> “Điểm đó là giới hạn thật của phiên bản này. Cơ chế hiện có bảo vệ được A, chưa chứng minh B. Nếu làm tiếp, nhóm ưu tiên C và sẽ dùng test D để kiểm tra. Nhóm không muốn lấy tên pattern thay cho bằng chứng.”

## Cách tự dựng một tình huống mới tại chỗ

1. Chọn **một mục tiêu**: khách đợi ít hơn, tài xế không bị giữ hai chuyến, kết quả retry rõ, hoặc phục hồi sau lỗi.
2. Chọn **một biến thay đổi**: thêm khách, thêm tài xế, đổi vị trí, hết thời gian, trùng request, mất response hoặc restart một thành phần.
3. Cùng mô tả **kết quả mong đợi** trước khi nói tên pattern.
4. Hỏi **nơi quyết định** và **bằng chứng**; nếu chưa có, đề nghị cùng viết test giả lập.
5. So sánh hai lựa chọn bằng **được gì / trả giá gì / khi nào đổi**, không bằng “pattern nào xịn hơn”.

Ví dụ nhẹ để kết thúc một lượt: “Nếu mình đổi giả định từ một process sang hai process thì phần nào của giải pháp còn giữ nguyên, phần nào phải đổi?” Không cần team phải giải xong kiến trúc mới tại chỗ.

## Phạm vi bằng chứng và nguồn


Đã fetch đúng head của năm PR, đọc README/ADR và các đường code trọng yếu. Link code trong hai tài liệu còn lại được ghim vào SHA để có thể đối chiếu đúng snapshot.

| PR | Head đã đọc | Kiểm chứng thực thi |
|---|---|---|
| [#18 Thien](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/18) | `21e1dd3` | Đọc code/docs/tests; chưa chạy suite Java |
| [#19 Jessica](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/19) | `12ddecf` | 81 test/19 file pass; TypeScript build pass; probe use-case tái hiện J1 và J3 |
| [#20 KVP](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/20) | `a843c02` | `go test ./...` pass; `make test-int` pass với Colima socket; chưa chạy e2e hoặc fault injection broker |
| [#21 Grace](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/21) | `38b1dc2` | Đọc code/docs/tests; chưa chạy suite Elixir |
| [#22 Light](https://github.com/twvn-dev-community-coding-challenge/coding-challenges/pull/22) | `c471fa8` | Đọc code/docs/tests; chưa chạy suite .NET |

KVP integration lần đầu lỗi tìm Docker provider; chạy lại với `DOCKER_HOST=unix:///Users/sunniesz/.colima/default/docker.sock` thì pass. Đây là vấn đề cấu hình máy kiểm tra, không phải lỗi nghiệp vụ. Test saga dùng PostgreSQL thật nhưng participant mô phỏng; không được trình bày thành đã kiểm tra broker thật trong lần rà soát này.

Không xác minh deadline lịch sử, không kết luận điểm số hoặc thứ hạng. Ngày Q&A lấy theo bạn nói “ngày mai”, chưa có lịch ban tổ chức độc lập. Không sửa code, không comment PR, không gửi câu hỏi cho ai.

**Lưu ý bản tổng hợp:** câu mở đầu và follow-up là nội dung chuẩn bị thảo luận, không phải phát ngôn hoặc câu trả lời của các team. Tất cả policy tương lai phải được xác nhận như giả định. Phần trả lời KVP là gợi ý dựa trên snapshot code, cần team thống nhất cách nói trước buổi Q&A. Không có thay đổi code hoặc kết quả test mới trong lần mở rộng tài liệu này.
