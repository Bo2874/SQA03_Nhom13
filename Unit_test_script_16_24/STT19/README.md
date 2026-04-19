# STT 20 — Kết Quả Test (Quick Reference)

**Trạng thái:** ✅ **PASS** — 27/27 Test Cases, 100% Coverage

---

## 📌 File Quan Trọng

| File | Mục đích | Cách xem |
|------|---------|----------|
| **`STT20_COMPREHENSIVE_REPORT.md`** | 📄 **Báo cáo chi tiết lengthened** (HTML embedded) | `code STT20_COMPREHENSIVE_REPORT.md` |
| **`search.api.test.ts`** | 🧪 **File test source code** (27 TC) | `code search.api.test.ts` |
| **`jest.coverage.20.js`** | ⚙️ **Jest config** | `code jest.coverage.20.js` |
| **`coverage/index.html`** | 🌐 **HTML Coverage Report** (Interactive) | `start coverage/index.html` hoặc `node serve-coverage.js 8000 20` |

---

## 🚀 Chạy Test Ngay

```bash
cd test

# Chạy test
npm run test:20

# Chạy coverage + sinh HTML
npm run coverage:20

# Mở HTML report (HTTP server)
node serve-coverage.js 8000 20
# Mở: http://localhost:8000/index.html
```

---

## 📊 Kết Quả Tóm Tắt

| Chỉ số | Kết quả | Mục tiêu | Status |
|--------|--------|----------|--------|
| **Test Pass** | 27/27 | 100% | ✅ |
| **Statements** | 100% (102/102) | ≥ 80% | ✅ |
| **Branches** | 100% (3/3) | ≥ 70% | ✅ |
| **Functions** | 100% (3/3) | ≥ 90% | ✅ |
| **Lines** | 100% (102/102) | ≥ 80% | ✅ |

---

## 📚 Danh Sách Test Cases

### Nhóm A — searchCourses (16 TC)
- TC_01: Params rỗng
- TC_02 → TC_05: Query params construction
- TC_06 → TC_11: Keyword encoding
- TC_12 → TC_14: Pagination edge
- TC_15 → TC_16: Response shape

### Nhóm B — searchTeachers (3 TC)
- TC_17: Params passing
- TC_18: Response shape preservation
- TC_19: Empty results

### Nhóm C — getTeacherById (4 TC)
- TC_20: URL construction
- TC_21: Edge case id=0
- TC_22: Nested array preservation
- TC_23: 404 error propagation

### Nhóm D — ERROR & BEHAVIOR (4 TC)
- TC_24: Network error
- TC_25: Server error 500
- TC_26: No debounce (5x call)
- TC_27: No request cancellation

---

## 🔍 Xem Chi Tiết

1. **Báo cáo đầy đủ:** `STT20_COMPREHENSIVE_REPORT.md`
2. **HTML coverage:** `coverage/index.html`
3. **Chi tiết code:** `coverage/search.ts.html`
4. **Test code:** `search.api.test.ts`

---

**Generated:** 2026-04-19  
**Status:** ✅ Ready for submission
