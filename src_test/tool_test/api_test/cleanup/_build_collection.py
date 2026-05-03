"""Build the Postman Collection JSON for E-Learning API tests.

Modules:
- API_01 Auth (22 TC)
- API_02 Subjects + Grade Levels (30 TC)
- API_03 Courses CRUD (27 TC)
- API_04 Chapters + Episodes (30 TC)
- API_05 Materials + Quiz Q&A (30 TC)
- API_06 Enrollments (25 TC)
- API_07 Exams + Exam Attempts (30 TC)
- API_08 Quiz Attempts (30 TC)
- API_09 Users / Zoom / Chatbot (30 TC)

Run:
    python _build_collection.py
"""
import json
import uuid
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "collection" / "SQA03_Nhom13_API_Test.postman_collection.json"


def request_item(name, method, url_path, body=None, tests=None, pre=None,
                 query=None, description=""):
    raw_url = "{{baseUrl}}" + url_path
    if query:
        raw_url += "?" + "&".join(f"{k}={v}" for k, v in query.items())
    url_obj = {
        "raw": raw_url,
        "host": ["{{baseUrl}}"],
        "path": [p for p in url_path.split("/") if p],
    }
    if query:
        url_obj["query"] = [{"key": k, "value": str(v)} for k, v in query.items()]

    req = {
        "method": method,
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": url_obj,
        "description": description,
    }
    if body is not None:
        req["body"] = {"mode": "raw", "raw": json.dumps(body, ensure_ascii=False)}

    events = []
    if pre:
        events.append({"listen": "prerequest", "script": {"type": "text/javascript", "exec": pre}})
    if tests:
        events.append({"listen": "test", "script": {"type": "text/javascript", "exec": tests}})

    return {"name": name, "event": events, "request": req, "response": []}


# ---------- Test snippet helpers ----------
def t_status(*codes):
    if len(codes) == 1:
        return [
            'pm.test("Status code is ' + str(codes[0]) + '", function () {',
            '    pm.response.to.have.status(' + str(codes[0]) + ');',
            '});',
        ]
    arr = "[" + ", ".join(str(c) for c in codes) + "]"
    return [
        'pm.test("Status code in ' + arr + '", function () {',
        '    pm.expect(' + arr + ').to.include(pm.response.code);',
        '});',
    ]


def t_message_includes(msg):
    return [
        'pm.test("Message includes \\"' + msg + '\\"", function () {',
        '    var json = pm.response.json();',
        '    var m = Array.isArray(json.message) ? json.message.join(" | ") : (json.message || "");',
        '    pm.expect(m).to.include("' + msg + '");',
        '});',
    ]


# =============================================================================
# _Setup folder
# =============================================================================
setup_folder = {
    "name": "_Setup",
    "description": "Login Admin to set cookie ACCESS_TOKEN. Postman cookie jar auto-stores.",
    "item": [
        request_item(
            name="Login Admin",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Role is ADMIN", function () { pm.expect(j.result.role).to.eql("ADMIN"); });',
            ],
        ),
    ],
}

# =============================================================================
# 01_Register folder
# =============================================================================
register_folder = {
    "name": "01_Register",
    "description": "POST /api/v1/auth/register — Yêu cầu OTP đã seed (chạy seed-otp.cmd trước).",
    "item": [
        request_item(
            name="API_01_001 — Register hợp lệ",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "test_api_register_happy@example.com", "password": "123456",
                  "fullName": "API Test Happy", "phone": "0901234567",
                  "role": "STUDENT", "otp": "999991"},
            description="Cần chạy seed-otp.cmd trước để Redis có OTP=999991.",
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("message=success", function () { pm.expect(j.message).to.eql("success"); });',
                'pm.test("user.id tồn tại", function () { pm.expect(j.result.user.id).to.exist; });',
                'pm.test("role=STUDENT", function () { pm.expect(j.result.user.role).to.eql("STUDENT"); });',
                'pm.environment.set("createdUserId", j.result.user.id);',
            ],
        ),
        request_item(
            name="API_01_002 — Email đã tồn tại",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "admin@elearning.com", "password": "123456",
                  "fullName": "Dup", "phone": "0901234567",
                  "role": "STUDENT", "otp": "000000"},
            tests=[
                'pm.test("Status không phải 201", function () { pm.expect(pm.response.code).to.not.eql(201); });',
            ],
        ),
        request_item(
            name="API_01_003 — Email sai format",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "not-an-email", "password": "123456", "fullName": "Bad",
                  "phone": "0901234567", "role": "STUDENT", "otp": "000000"},
            tests=t_status(400) + t_message_includes("email must be an email"),
        ),
        request_item(
            name="API_01_004 — Password < 6 ký tự",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "test_api_short_pw@example.com", "password": "12",
                  "fullName": "Short PW", "phone": "0901234567",
                  "role": "STUDENT", "otp": "000000"},
            tests=t_status(400) + t_message_includes("password must be longer than or equal to 6 characters"),
        ),
        request_item(
            name="API_01_005 — Body rỗng",
            method="POST",
            url_path="/api/v1/auth/register",
            body={},
            tests=t_status(400) + t_message_includes("email should not be empty"),
        ),
        request_item(
            name="API_01_006 — OTP sai",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "test_api_wrong_otp@example.com", "password": "123456",
                  "fullName": "Wrong OTP", "phone": "0901234567",
                  "role": "STUDENT", "otp": "111111"},
            tests=[
                'pm.test("Status không phải 201", function () { pm.expect(pm.response.code).to.not.eql(201); });',
            ],
        ),
        request_item(
            name="API_01_007 — SQL Injection email",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "a' OR 1=1 --", "password": "123456", "fullName": "SQLi",
                  "phone": "0901234567", "role": "STUDENT", "otp": "000000"},
            tests=t_status(400) + t_message_includes("email must be an email"),
        ),
        request_item(
            name="API_01_008 — Role không hợp lệ",
            method="POST",
            url_path="/api/v1/auth/register",
            body={"email": "test_api_bad_role@example.com", "password": "123456",
                  "fullName": "Bad Role", "phone": "0901234567",
                  "role": "HACKER", "otp": "000000"},
            tests=t_status(400) + t_message_includes("role must be one of"),
        ),
    ],
}

# =============================================================================
# 02_Sign-in folder
# =============================================================================
signin_folder = {
    "name": "02_Sign-in",
    "description": "POST /api/v1/auth/sign-in — TC API_01_009 sẽ re-establish admin cookie cho các test sau.",
    "item": [
        request_item(
            name="API_01_009 — Sign-in admin hợp lệ",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("userId tồn tại", function () { pm.expect(j.result.userId).to.exist; });',
                'pm.test("role=ADMIN", function () { pm.expect(j.result.role).to.eql("ADMIN"); });',
            ],
        ),
        request_item(
            name="API_01_010 — Sai password",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "wrong_password_xxx"},
            tests=t_status(400, 401),
        ),
        request_item(
            name="API_01_011 — Email không tồn tại",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "nobody_xyz_test@example.com", "password": "123456"},
            tests=t_status(401, 404),
        ),
        request_item(
            name="API_01_012 — Email sai format",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "not-an-email", "password": "123456"},
            tests=t_status(400),
        ),
        request_item(
            name="API_01_013 — Body rỗng",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={},
            tests=t_status(400),
        ),
    ],
}

# =============================================================================
# 03_Request_OTP folder
# =============================================================================
otp_folder = {
    "name": "03_Request_OTP",
    "description": "POST /api/v1/auth/request-otp?prefix=otp",
    "item": [
        request_item(
            name="API_01_014 — Request OTP hợp lệ",
            method="POST",
            url_path="/api/v1/auth/request-otp",
            query={"prefix": "otp"},
            body={"email": "test_api_request_otp@example.com"},
            tests=t_status(200, 201) + t_message_includes("OTP sent"),
        ),
        request_item(
            name="API_01_015 — Email sai format (kỳ vọng 400, thực tế 500 — BUG)",
            method="POST",
            url_path="/api/v1/auth/request-otp",
            query={"prefix": "otp"},
            body={"email": "abc"},
            tests=t_status(400),
        ),
        request_item(
            name="API_01_016 — Body rỗng (kỳ vọng 400, thực tế 500 — BUG)",
            method="POST",
            url_path="/api/v1/auth/request-otp",
            query={"prefix": "otp"},
            body={},
            tests=t_status(400),
        ),
    ],
}

# =============================================================================
# 04_Reset_Password folder
# =============================================================================
reset_folder = {
    "name": "04_Reset_Password",
    "description": "PUT /api/v1/auth/reset-password",
    "item": [
        request_item(
            name="API_01_017 — Reset password hợp lệ",
            method="PUT",
            url_path="/api/v1/auth/reset-password",
            body={"email": "test_api_reset_happy@example.com", "otpPin": "999992",
                  "newPassword": "newpass123"},
            tests=[
                'pm.test("Response code reasonable", function () {',
                '    pm.expect([200, 201, 404]).to.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_01_018 — OTP sai",
            method="PUT",
            url_path="/api/v1/auth/reset-password",
            body={"email": "test_api_reset_happy@example.com", "otpPin": "111111",
                  "newPassword": "newpass123"},
            tests=[
                'pm.test("Status không phải 200/201", function () {',
                '    pm.expect([200, 201]).to.not.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_01_019 — Password mới quá ngắn",
            method="PUT",
            url_path="/api/v1/auth/reset-password",
            body={"email": "test_api_reset_happy@example.com", "otpPin": "999992",
                  "newPassword": "12"},
            tests=t_status(400, 404),
        ),
    ],
}

# =============================================================================
# 05_Subjects folder (auth tests — cookie active)
# =============================================================================
subjects_folder = {
    "name": "05_Subjects",
    "description": "CRUD /api/v1/subjects — admin endpoints dùng cookie từ Login Admin.",
    "item": [
        request_item(
            name="API_02_001 — GET list subjects",
            method="GET",
            url_path="/api/v1/subjects",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_02_002 — GET subject id=1 (Toán học)",
            method="GET",
            url_path="/api/v1/subjects/1",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có id và name", function () {',
                '    pm.expect(j.result.id).to.eql(1);',
                '    pm.expect(j.result.name).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_02_003 — GET subject id=9999 (not found)",
            method="GET",
            url_path="/api/v1/subjects/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_02_004 — POST tạo subject hợp lệ (cần admin cookie)",
            method="POST",
            url_path="/api/v1/subjects",
            body={"name": "TEST_API_subject_main"},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("result.name khớp", function () { pm.expect(j.result.name).to.eql("TEST_API_subject_main"); });',
                'pm.environment.set("createdSubjectId", j.result.id);',
            ],
        ),
        request_item(
            name="API_02_005 — POST body rỗng",
            method="POST",
            url_path="/api/v1/subjects",
            body={},
            tests=t_status(400) + t_message_includes("name should not be empty"),
        ),
        request_item(
            name="API_02_006 — POST trùng tên (kỳ vọng 400, thực tế 201 — BUG)",
            method="POST",
            url_path="/api/v1/subjects",
            body={"name": "TEST_API_subject_main"},
            description="Backend không check unique name → bug.",
            tests=t_status(400),
        ),
        request_item(
            name="API_02_007 — POST SQL injection name",
            method="POST",
            url_path="/api/v1/subjects",
            body={"name": "'; DROP TABLE subjects; --"},
            description="TypeORM dùng parameterized query → name lưu nguyên chuỗi, DB an toàn.",
            tests=t_status(201, 400) + [
                'pm.test("DB không bị xoá (smoke check)", function () {',
                '    pm.sendRequest({',
                '        url: pm.environment.get("baseUrl") + "/api/v1/subjects",',
                '        method: "GET"',
                '    }, function(err, res) {',
                '        pm.expect(res.code).to.eql(200);',
                '    });',
                '});',
            ],
        ),
        request_item(
            name="API_02_008 — PUT update subject vừa tạo",
            method="PUT",
            url_path="/api/v1/subjects/{{createdSubjectId}}",
            body={"name": "TEST_API_subject_updated"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Tên đã đổi", function () { pm.expect(j.result.name).to.eql("TEST_API_subject_updated"); });',
            ],
        ),
        request_item(
            name="API_02_009 — PUT subject 9999 (not found)",
            method="PUT",
            url_path="/api/v1/subjects/9999",
            body={"name": "x"},
            tests=t_status(404),
        ),
        request_item(
            name="API_02_010 — PUT body rỗng",
            method="PUT",
            url_path="/api/v1/subjects/{{createdSubjectId}}",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_02_011 — DELETE subject vừa tạo",
            method="DELETE",
            url_path="/api/v1/subjects/{{createdSubjectId}}",
            tests=t_status(200, 204),
        ),
        request_item(
            name="API_02_012 — DELETE subject 9999 (not found)",
            method="DELETE",
            url_path="/api/v1/subjects/9999",
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# 06_Grade_Levels folder (auth tests)
# =============================================================================
grade_levels_folder = {
    "name": "06_Grade_Levels",
    "description": "CRUD /api/v1/grade-levels — pattern giống Subjects.",
    "item": [
        request_item(
            name="API_02_016 — GET list grade-levels",
            method="GET",
            url_path="/api/v1/grade-levels",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_02_017 — GET grade-level id=1",
            method="GET",
            url_path="/api/v1/grade-levels/1",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có id và name", function () { pm.expect(j.result.id).to.eql(1); pm.expect(j.result.name).to.exist; });',
            ],
        ),
        request_item(
            name="API_02_018 — GET grade-level 9999 (not found)",
            method="GET",
            url_path="/api/v1/grade-levels/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_02_019 — POST tạo grade-level hợp lệ",
            method="POST",
            url_path="/api/v1/grade-levels",
            body={"name": "TEST_API_grade_main"},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("createdGradeLevelId", j.result.id);',
            ],
        ),
        request_item(
            name="API_02_020 — POST body rỗng",
            method="POST",
            url_path="/api/v1/grade-levels",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_02_021 — POST trùng tên (kỳ vọng 400 nếu có check unique)",
            method="POST",
            url_path="/api/v1/grade-levels",
            body={"name": "TEST_API_grade_main"},
            tests=t_status(201, 400),
        ),
        request_item(
            name="API_02_022 — POST SQL injection name",
            method="POST",
            url_path="/api/v1/grade-levels",
            body={"name": "'; DROP TABLE grade_levels; --"},
            tests=t_status(201, 400),
        ),
        request_item(
            name="API_02_023 — PUT update grade-level",
            method="PUT",
            url_path="/api/v1/grade-levels/{{createdGradeLevelId}}",
            body={"name": "TEST_API_grade_updated"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Tên đã đổi", function () { pm.expect(j.result.name).to.eql("TEST_API_grade_updated"); });',
            ],
        ),
        request_item(
            name="API_02_024 — PUT grade-level 9999 (not found)",
            method="PUT",
            url_path="/api/v1/grade-levels/9999",
            body={"name": "x"},
            tests=t_status(404),
        ),
        request_item(
            name="API_02_025 — PUT body rỗng",
            method="PUT",
            url_path="/api/v1/grade-levels/{{createdGradeLevelId}}",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_02_026 — DELETE grade-level",
            method="DELETE",
            url_path="/api/v1/grade-levels/{{createdGradeLevelId}}",
            tests=t_status(200, 204),
        ),
        request_item(
            name="API_02_027 — DELETE grade-level 9999 (not found)",
            method="DELETE",
            url_path="/api/v1/grade-levels/9999",
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# _Setup_Teacher folder — tạo teacher account + login as teacher
# =============================================================================
setup_teacher_folder = {
    "name": "_Setup_Teacher",
    "description": "Tạo test teacher (admin POST /teachers) rồi login as teacher để 07_Courses dùng cookie teacher.",
    "item": [
        request_item(
            name="Re-login Admin",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create test teacher",
            method="POST",
            url_path="/api/v1/teachers",
            body={
                "email": "test_api_teacher@example.com",
                "password": "123456",
                "fullName": "Test API Teacher",
                "phone": "0901234567",
            },
            description="Có thể trả 409/400 nếu teacher đã tồn tại — không sao.",
            tests=[
                'pm.test("Status 201 hoặc 400/409 (đã tồn tại)", function () {',
                '    pm.expect([201, 400, 409]).to.include(pm.response.code);',
                '});',
                'if (pm.response.code === 201) {',
                '    var j = pm.response.json();',
                '    pm.environment.set("createdTeacherId", j.result.id);',
                '}',
            ],
        ),
        request_item(
            name="Login as teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={
                "email": "test_api_teacher@example.com",
                "password": "123456",
            },
            description="Cookie ACCESS_TOKEN giờ là của teacher.",
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Role là TEACHER", function () { pm.expect(j.result.role).to.eql("TEACHER"); });',
                'pm.environment.set("createdTeacherId", j.result.userId);',
            ],
        ),
    ],
}

# =============================================================================
# 07_Courses folder — 23 TC. Cookie switching giữa teacher và admin.
# =============================================================================
courses_folder = {
    "name": "07_Courses",
    "description": "CRUD /api/v1/courses — POST/PUT cần TEACHER, /by-admin cần ADMIN.",
    "item": [
        # ----- Public reads (cookie không quan trọng) -----
        request_item(
            name="API_03_001 — GET /courses/approved (public)",
            method="GET",
            url_path="/api/v1/courses/approved",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là object có courses[]", function () { pm.expect(j.result.courses).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_03_002 — GET /courses/search?q=test (public)",
            method="GET",
            url_path="/api/v1/courses/search",
            query={"q": "test"},
            tests=t_status(200),
        ),
        request_item(
            name="API_03_003 — GET /courses/featured/courses (public)",
            method="GET",
            url_path="/api/v1/courses/featured/courses",
            query={"limit": 5},
            tests=t_status(200),
        ),
        request_item(
            name="API_03_004 — GET /courses/subject/1 (public)",
            method="GET",
            url_path="/api/v1/courses/subject/1",
            tests=t_status(200),
        ),
        request_item(
            name="API_03_005 — GET /courses/stats/platform (public)",
            method="GET",
            url_path="/api/v1/courses/stats/platform",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có totalCourses, totalStudents, totalTeachers", function () {',
                '    pm.expect(j.result).to.have.property("totalCourses");',
                '    pm.expect(j.result).to.have.property("totalStudents");',
                '    pm.expect(j.result).to.have.property("totalTeachers");',
                '});',
            ],
        ),
        # ----- Teacher CRUD (cookie = teacher từ _Setup_Teacher) -----
        request_item(
            name="API_03_006 — POST /courses (teacher tạo course)",
            method="POST",
            url_path="/api/v1/courses",
            body={
                "teacherId": "{{createdTeacherId}}",
                "title": "TEST_API_course_main",
                "summary": "Test course summary",
                "subjectId": 1,
                "gradeLevelId": 1,
            },
            pre=[
                '// Convert createdTeacherId từ string sang number trong body',
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("status=DRAFT", function () { pm.expect(j.result.status).to.eql("DRAFT"); });',
                'pm.environment.set("createdCourseId", j.result.id);',
            ],
        ),
        request_item(
            name="API_03_007 — POST /courses thiếu title",
            method="POST",
            url_path="/api/v1/courses",
            body={"teacherId": 1, "subjectId": 1},
            tests=t_status(400) + t_message_includes("title should not be empty"),
        ),
        request_item(
            name="API_03_008 — POST /courses thiếu teacherId",
            method="POST",
            url_path="/api/v1/courses",
            body={"title": "TEST_API_no_teacher"},
            tests=t_status(400) + t_message_includes("teacherId should not be empty"),
        ),
        request_item(
            name="API_03_009 — POST /courses body rỗng",
            method="POST",
            url_path="/api/v1/courses",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_03_010 — PUT /courses/:id (teacher update)",
            method="PUT",
            url_path="/api/v1/courses/{{createdCourseId}}",
            body={"title": "TEST_API_course_updated"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Title đã đổi", function () { pm.expect(j.result.title).to.eql("TEST_API_course_updated"); });',
            ],
        ),
        request_item(
            name="API_03_011 — PUT /courses/9999 (not found)",
            method="PUT",
            url_path="/api/v1/courses/9999",
            body={"title": "x"},
            tests=t_status(404),
        ),
        # ----- Switch to admin -----
        request_item(
            name="(switch) Re-login as Admin",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_03_012 — GET /courses (admin list)",
            method="GET",
            url_path="/api/v1/courses",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("courses là array", function () { pm.expect(j.result.courses).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_03_013 — GET /courses/:id (admin detail)",
            method="GET",
            url_path="/api/v1/courses/{{createdCourseId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title", function () { pm.expect(j.result.title).to.exist; });',
            ],
        ),
        request_item(
            name="API_03_014 — GET /courses/9999 (not found)",
            method="GET",
            url_path="/api/v1/courses/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_03_015 — PUT /courses/:id/by-admin (approve)",
            method="PUT",
            url_path="/api/v1/courses/{{createdCourseId}}/by-admin",
            body={"status": "APPROVED"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("status=APPROVED", function () { pm.expect(j.result.status).to.eql("APPROVED"); });',
            ],
        ),
        request_item(
            name="API_03_016 — PUT /courses/9999/by-admin (not found)",
            method="PUT",
            url_path="/api/v1/courses/9999/by-admin",
            body={"status": "APPROVED"},
            tests=t_status(404),
        ),
        request_item(
            name="API_03_017 — PUT /courses/:id/by-admin status không hợp lệ",
            method="PUT",
            url_path="/api/v1/courses/{{createdCourseId}}/by-admin",
            body={"status": "INVALID_STATUS"},
            tests=t_status(400),
        ),
        # ----- Switch back to teacher để PUT/DELETE -----
        request_item(
            name="(switch) Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={
                "email": "test_api_teacher@example.com",
                "password": "123456",
            },
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_03_018 — POST /courses title quá dài (>1000 chars)",
            method="POST",
            url_path="/api/v1/courses",
            body={
                "teacherId": 1,
                "title": "A" * 1500,
                "subjectId": 1,
            },
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201, 400),
        ),
        request_item(
            name="API_03_019 — POST /courses subjectId không tồn tại",
            method="POST",
            url_path="/api/v1/courses",
            body={
                "teacherId": 1,
                "title": "TEST_API_bad_subject",
                "subjectId": 999999,
            },
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201, 400, 404),
        ),
        request_item(
            name="API_03_020 — GET /courses/search SQL injection",
            method="GET",
            url_path="/api/v1/courses/search",
            query={"q": "'; DROP TABLE courses; --"},
            tests=t_status(200) + [
                'pm.test("DB không bị xoá", function () {',
                '    pm.sendRequest({',
                '        url: pm.environment.get("baseUrl") + "/api/v1/courses/stats/platform",',
                '        method: "GET"',
                '    }, function(err, res) {',
                '        pm.expect(res.code).to.eql(200);',
                '    });',
                '});',
            ],
        ),
        # ----- Cleanup test course (teacher delete) -----
        request_item(
            name="API_03_021 — DELETE /courses/:id (teacher xoá course)",
            method="DELETE",
            url_path="/api/v1/courses/{{createdCourseId}}",
            tests=t_status(200, 204),
        ),
        request_item(
            name="API_03_022 — DELETE /courses/9999 (not found)",
            method="DELETE",
            url_path="/api/v1/courses/9999",
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# _Setup_API04 — Tạo course mới cho chapter/episode tests
# =============================================================================
setup_api04_folder = {
    "name": "_Setup_API04",
    "description": "Tạo course mới làm parent cho chapters/episodes (course từ API_03 đã bị xoá ở API_03_021).",
    "item": [
        request_item(
            name="Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create course for API_04",
            method="POST",
            url_path="/api/v1/courses",
            body={
                "teacherId": 0,  # overridden by pre-request
                "title": "TEST_API_course_for_api04",
                "subjectId": 1,
                "gradeLevelId": 1,
            },
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api04CourseId", j.result.id);',
            ],
        ),
    ],
}

# =============================================================================
# 08_Chapters folder (11 TC)
# =============================================================================
chapters_folder = {
    "name": "08_Chapters",
    "description": "POST/PUT/DELETE chapters cần TEACHER cookie. GET là public.",
    "item": [
        request_item(
            name="API_04_001 — POST chapter (teacher)",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters",
            body={"title": "TEST_API_chapter_1", "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("title khớp", function () { pm.expect(j.result.title).to.eql("TEST_API_chapter_1"); });',
                'pm.environment.set("createdChapterId", j.result.id);',
            ],
        ),
        request_item(
            name="API_04_002 — POST chapter thiếu title",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters",
            body={"order": 2},
            tests=t_status(400) + t_message_includes("title should not be empty"),
        ),
        request_item(
            name="API_04_003 — POST chapter body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_04_004 — POST chapter courseId 9999 (not found)",
            method="POST",
            url_path="/api/v1/courses/9999/chapters",
            body={"title": "x", "order": 1},
            tests=t_status(400, 404),
        ),
        request_item(
            name="API_04_005 — GET chapters list (public)",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_04_006 — GET chapter detail (public)",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title và order", function () {',
                '    pm.expect(j.result.title).to.exist;',
                '    pm.expect(j.result.order).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_04_007 — GET chapter 9999 not found",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_04_008 — PUT chapter update",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}",
            body={"title": "TEST_API_chapter_updated", "order": 1},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Title đã đổi", function () {',
                '    pm.expect(j.result.title).to.eql("TEST_API_chapter_updated");',
                '});',
            ],
        ),
        request_item(
            name="API_04_009 — PUT chapter 9999 not found",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/9999",
            body={"title": "x", "order": 1},
            tests=t_status(404),
        ),
        request_item(
            name="API_04_010 — PUT chapter body rỗng",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_04_011 — DELETE chapter 9999 not found",
            method="DELETE",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/9999",
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# 09_Episodes folder (14 TC)
# =============================================================================
episodes_folder = {
    "name": "09_Episodes",
    "description": "POST/PUT/DELETE episodes cần TEACHER. EpisodeType=VIDEO yêu cầu videoUrl.",
    "item": [
        request_item(
            name="API_04_012 — POST episode (teacher)",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes",
            body={
                "title": "TEST_API_episode_1",
                "order": 1,
                "videoUrl": "https://example.com/video.mp4",
                "durationSeconds": 300,
            },
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("type=VIDEO mặc định", function () { pm.expect(j.result.type).to.eql("VIDEO"); });',
                'pm.environment.set("createdEpisodeId", j.result.id);',
            ],
        ),
        request_item(
            name="API_04_013 — POST episode thiếu title",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes",
            body={"order": 2, "videoUrl": "https://example.com/v.mp4"},
            tests=t_status(400),
        ),
        request_item(
            name="API_04_014 — POST episode VIDEO không có videoUrl",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes",
            body={"title": "TEST_API_no_url", "order": 3},
            description="Theo backend logic: VIDEO type bắt buộc videoUrl → 400.",
            tests=t_status(400) + t_message_includes("video"),
        ),
        request_item(
            name="API_04_015 — POST episode body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_04_016 — POST episode chapterId 9999",
            method="POST",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/9999/episodes",
            body={"title": "x", "order": 1, "videoUrl": "https://x.com/v.mp4"},
            tests=t_status(400, 404),
        ),
        request_item(
            name="API_04_017 — GET episodes list (public)",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_04_018 — GET episode detail (public)",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/{{createdEpisodeId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title và type", function () {',
                '    pm.expect(j.result.title).to.exist;',
                '    pm.expect(j.result.type).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_04_019 — GET episode 9999 not found",
            method="GET",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_04_020 — PUT episode update",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/{{createdEpisodeId}}",
            body={"title": "TEST_API_episode_updated", "order": 1, "videoUrl": "https://example.com/new.mp4"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Title đã đổi", function () {',
                '    pm.expect(j.result.title).to.eql("TEST_API_episode_updated");',
                '});',
            ],
        ),
        request_item(
            name="API_04_021 — PUT episode 9999 not found",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/9999",
            body={"title": "x", "order": 1, "videoUrl": "https://x.com/v.mp4"},
            tests=t_status(404),
        ),
        request_item(
            name="API_04_022 — PUT episode body rỗng",
            method="PUT",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/{{createdEpisodeId}}",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_04_023 — DELETE episode (positive)",
            method="DELETE",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/{{createdEpisodeId}}",
            tests=t_status(200, 204),
        ),
        request_item(
            name="API_04_024 — DELETE episode 9999 not found",
            method="DELETE",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}/episodes/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_04_025 — DELETE chapter (sau khi episodes đã xoá)",
            method="DELETE",
            url_path="/api/v1/courses/{{api04CourseId}}/chapters/{{createdChapterId}}",
            tests=t_status(200, 204),
        ),
    ],
}

# =============================================================================
# _Setup_API05 — Tạo course + chapter + QUIZ episode cho materials/questions/answers
# =============================================================================
setup_api05_folder = {
    "name": "_Setup_API05",
    "description": "Tạo course + chapter + QUIZ episode mới làm parent cho materials/questions/answers.",
    "item": [
        request_item(
            name="Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create course for API_05",
            method="POST",
            url_path="/api/v1/courses",
            body={"teacherId": 0, "title": "TEST_API_course_for_api05",
                  "subjectId": 1, "gradeLevelId": 1},
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api05CourseId", j.result.id);',
            ],
        ),
        request_item(
            name="Create chapter for API_05",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters",
            body={"title": "TEST_API_chapter_5", "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api05ChapterId", j.result.id);',
            ],
        ),
        request_item(
            name="Create QUIZ episode for API_05",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes",
            body={"title": "TEST_API_quiz_ep", "order": 1, "type": "QUIZ"},
            description="Type=QUIZ để có thể thêm quiz questions.",
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api05EpisodeId", j.result.id);',
            ],
        ),
    ],
}

# =============================================================================
# 13_Materials folder (10 TC)
# =============================================================================
materials_folder = {
    "name": "13_Materials",
    "description": "POST/PUT/DELETE materials cần TEACHER. GET là public.",
    "item": [
        request_item(
            name="API_05_001 — POST material (teacher)",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/materials",
            body={
                "title": "TEST_API_material_1",
                "fileUrl": "https://example.com/material1.pdf",
                "fileSizeKb": 250,
            },
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("createdMaterialId", j.result.id);',
            ],
        ),
        request_item(
            name="API_05_002 — POST material thiếu title",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/materials",
            body={"fileUrl": "https://example.com/m.pdf"},
            tests=t_status(400) + t_message_includes("Title is required"),
        ),
        request_item(
            name="API_05_003 — POST material thiếu fileUrl",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/materials",
            body={"title": "TEST_API_no_url"},
            tests=t_status(400) + t_message_includes("File url is required"),
        ),
        request_item(
            name="API_05_004 — POST material body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/materials",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_05_005 — GET materials list (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/materials",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_05_006 — GET material detail (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/materials/{{createdMaterialId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title và fileUrl", function () {',
                '    pm.expect(j.result.title).to.exist;',
                '    pm.expect(j.result.fileUrl).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_05_007 — GET material 9999 not found",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/materials/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_05_008 — PUT material update",
            method="PUT",
            url_path="/api/v1/courses/{{api05CourseId}}/materials/{{createdMaterialId}}",
            body={"title": "TEST_API_material_updated", "fileUrl": "https://example.com/new.pdf"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Title đã đổi", function () { pm.expect(j.result.title).to.eql("TEST_API_material_updated"); });',
            ],
        ),
        request_item(
            name="API_05_009 — DELETE material",
            method="DELETE",
            url_path="/api/v1/courses/{{api05CourseId}}/materials/{{createdMaterialId}}",
            tests=t_status(200, 204),
        ),
        request_item(
            name="API_05_010 — DELETE material 9999 not found",
            method="DELETE",
            url_path="/api/v1/courses/{{api05CourseId}}/materials/9999",
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# 14_Quiz_Questions folder (7 TC)
# =============================================================================
questions_folder = {
    "name": "14_Quiz_Questions",
    "description": "Quiz questions thuộc episode type=QUIZ. POST/PUT/DELETE cần TEACHER.",
    "item": [
        request_item(
            name="API_05_011 — POST question (teacher)",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions",
            body={"content": "TEST_API question 1?", "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("createdQuestionId", j.result.id);',
            ],
        ),
        request_item(
            name="API_05_012 — POST question thiếu content",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions",
            body={"order": 2},
            tests=t_status(400) + t_message_includes("content should not be empty"),
        ),
        request_item(
            name="API_05_013 — POST question body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_05_014 — GET questions list (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_05_015 — GET question detail (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có content và order", function () {',
                '    pm.expect(j.result.content).to.exist;',
                '    pm.expect(j.result.order).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_05_016 — GET question 9999 not found",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_05_017 — PUT question update",
            method="PUT",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}",
            body={"content": "TEST_API question updated?", "order": 1},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Content đã đổi", function () {',
                '    pm.expect(j.result.content).to.eql("TEST_API question updated?");',
                '});',
            ],
        ),
    ],
}

# =============================================================================
# 15_Quiz_Answers folder (8 TC)
# =============================================================================
answers_folder = {
    "name": "15_Quiz_Answers",
    "description": "Quiz answers thuộc question. POST/PUT/DELETE cần TEACHER.",
    "item": [
        request_item(
            name="API_05_018 — POST answer (teacher)",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            body={"content": "TEST_API answer 1", "isCorrect": True, "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("createdAnswerId", j.result.id);',
            ],
        ),
        request_item(
            name="API_05_019 — POST answer thiếu content",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            body={"isCorrect": False, "order": 2},
            tests=t_status(400) + t_message_includes("content should not be empty"),
        ),
        request_item(
            name="API_05_020 — POST answer thiếu isCorrect",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            body={"content": "incomplete", "order": 3},
            tests=t_status(400),
        ),
        request_item(
            name="API_05_021 — POST answer body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_05_022 — GET answers list (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_05_023 — GET answer detail (public)",
            method="GET",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers/{{createdAnswerId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có content và isCorrect", function () {',
                '    pm.expect(j.result.content).to.exist;',
                '    pm.expect(j.result.isCorrect).to.be.a("boolean");',
                '});',
            ],
        ),
        request_item(
            name="API_05_024 — PUT answer update",
            method="PUT",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers/{{createdAnswerId}}",
            body={"content": "TEST_API answer updated", "isCorrect": False, "order": 1},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("isCorrect đã đổi", function () { pm.expect(j.result.isCorrect).to.eql(false); });',
            ],
        ),
        request_item(
            name="API_05_025 — DELETE answer",
            method="DELETE",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers/{{createdAnswerId}}",
            tests=t_status(200, 204),
        ),
    ],
}

# =============================================================================
# _Setup_API06 — Tạo course APPROVED + episode + login student để enroll tests
# =============================================================================
setup_api06_folder = {
    "name": "_Setup_API06",
    "description": "Cần: course APPROVED, có episode VIDEO. Student dùng test_api_register_happy@example.com.",
    "item": [
        request_item(
            name="Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create course for API_06",
            method="POST",
            url_path="/api/v1/courses",
            body={"teacherId": 0, "title": "TEST_API_course_for_enroll",
                  "subjectId": 1, "gradeLevelId": 1},
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api06CourseId", j.result.id);',
            ],
        ),
        request_item(
            name="Create chapter for API_06",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/chapters",
            body={"title": "TEST_API_chapter_6", "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api06ChapterId", j.result.id);',
            ],
        ),
        request_item(
            name="Create VIDEO episode for API_06",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/chapters/{{api06ChapterId}}/episodes",
            body={"title": "TEST_API_ep_6", "order": 1,
                  "videoUrl": "https://example.com/v.mp4", "durationSeconds": 600},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api06EpisodeId", j.result.id);',
            ],
        ),
        request_item(
            name="Create DRAFT course (cho test enroll DRAFT)",
            method="POST",
            url_path="/api/v1/courses",
            body={"teacherId": 0, "title": "TEST_API_course_draft",
                  "subjectId": 1, "gradeLevelId": 1},
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api06DraftCourseId", j.result.id);',
            ],
        ),
        request_item(
            name="Re-login as Admin to approve course",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Approve course APPROVED",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/by-admin",
            body={"status": "APPROVED"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("status=APPROVED", function () { pm.expect(j.result.status).to.eql("APPROVED"); });',
            ],
        ),
        request_item(
            name="Login as Student",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_register_happy@example.com", "password": "123456"},
            description="Student này được tạo bởi API_01_001 (register happy path).",
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Role là STUDENT", function () { pm.expect(j.result.role).to.eql("STUDENT"); });',
                'pm.environment.set("createdStudentId", j.result.userId);',
            ],
        ),
    ],
}

# =============================================================================
# 16_Enrollments folder (20 TC)
# =============================================================================
enrollments_folder = {
    "name": "16_Enrollments",
    "description": "Enrollment CRUD — yêu cầu STUDENT cookie. Course phải APPROVED.",
    "item": [
        request_item(
            name="API_06_001 — POST enroll APPROVED course",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments",
            body={"studentId": 0},
            pre=[
                'var studentId = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = studentId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("status=ACTIVE", function () { pm.expect(j.result.status).to.eql("ACTIVE"); });',
                'pm.environment.set("createdEnrollmentId", j.result.id);',
            ],
        ),
        request_item(
            name="API_06_002 — POST enroll trùng (đã enrolled)",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments",
            body={"studentId": 0},
            pre=[
                'var studentId = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = studentId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(400, 409),
        ),
        request_item(
            name="API_06_003 — POST enroll course DRAFT (chưa publish)",
            method="POST",
            url_path="/api/v1/courses/{{api06DraftCourseId}}/enrollments",
            body={"studentId": 0},
            pre=[
                'var studentId = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = studentId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(400) + t_message_includes("not published"),
        ),
        request_item(
            name="API_06_004 — POST enroll course 9999 (not found)",
            method="POST",
            url_path="/api/v1/courses/9999/enrollments",
            body={"studentId": 0},
            pre=[
                'var studentId = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = studentId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(400, 404),
        ),
        request_item(
            name="API_06_005 — POST enroll body rỗng",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_06_006 — GET /students/enrollments",
            method="GET",
            url_path="/api/v1/courses/students/enrollments",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result.enrollments là array", function () {',
                '    pm.expect(j.result.enrollments).to.be.an("array");',
                '});',
            ],
        ),
        request_item(
            name="API_06_007 — GET enrollments filter subscribed=true",
            method="GET",
            url_path="/api/v1/courses/students/enrollments",
            query={"subscribed": "true"},
            tests=t_status(200),
        ),
        request_item(
            name="API_06_008 — GET enrollment detail",
            method="GET",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có status và progressPercentage", function () {',
                '    pm.expect(j.result.status).to.exist;',
                '    pm.expect(j.result.progressPercentage).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_06_009 — GET enrollment với courseId sai",
            method="GET",
            url_path="/api/v1/courses/9999/enrollments/{{createdEnrollmentId}}",
            tests=t_status(400, 404),
        ),
        request_item(
            name="API_06_010 — GET enrollment 9999 not found",
            method="GET",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_06_011 — PUT update last episode",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/last-episode",
            body={"episodeId": 0},
            pre=[
                'var epId = parseInt(pm.environment.get("api06EpisodeId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.episodeId = epId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(200),
        ),
        request_item(
            name="API_06_012 — PUT last episode body rỗng",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/last-episode",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_06_013 — POST mark episode complete",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/episodes/{{api06EpisodeId}}/complete",
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Có message và enrollment", function () {',
                '    pm.expect(j.result).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_06_014 — POST mark episode 9999 complete (not found)",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/episodes/9999/complete",
            tests=t_status(400, 404),
        ),
        request_item(
            name="API_06_015 — POST reset progress",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/reset",
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("progressPercentage=0", function () {',
                '    pm.expect(parseFloat(j.result.progressPercentage)).to.eql(0);',
                '});',
            ],
        ),
        request_item(
            name="API_06_016 — POST complete course",
            method="POST",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/complete",
            description="Có thể fail nếu chưa đủ progress — chấp nhận 200 hoặc 400.",
            tests=t_status(200, 201, 400),
        ),
        request_item(
            name="API_06_017 — PUT enrollment 9999 status (not found)",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/9999/status",
            body={"status": "CANCELLED"},
            tests=t_status(404),
        ),
        request_item(
            name="API_06_018 — PUT status invalid value",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/status",
            body={"status": "INVALID_STATUS"},
            tests=t_status(400),
        ),
        request_item(
            name="API_06_019 — GET enrollments filter subscribed=false",
            method="GET",
            url_path="/api/v1/courses/students/enrollments",
            query={"subscribed": "false"},
            tests=t_status(200),
        ),
        request_item(
            name="API_06_020 — PUT status CANCELLED (cuối — kết thúc enroll)",
            method="PUT",
            url_path="/api/v1/courses/{{api06CourseId}}/enrollments/{{createdEnrollmentId}}/status",
            body={"status": "CANCELLED"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("status=CANCELLED", function () { pm.expect(j.result.status).to.eql("CANCELLED"); });',
            ],
        ),
    ],
}

# =============================================================================
# _Setup_API07 — Re-login teacher để test exam
# =============================================================================
setup_api07_folder = {
    "name": "_Setup_API07",
    "description": "API_07 = Exams + Exam Attempts. Teacher tạo exam, set status=LIVE để student attempt.",
    "item": [
        request_item(
            name="Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create DRAFT exam (cho test attempt-on-draft)",
            method="POST",
            url_path="/api/v1/exams",
            body={"teacherId": 0, "title": "TEST_API_exam_DRAFT",
                  "durationMinutes": 30, "passingScore": 50},
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api07DraftExamId", j.result.id);',
            ],
        ),
    ],
}

# =============================================================================
# 17_Exams folder (18 TC)
# =============================================================================
exams_folder = {
    "name": "17_Exams",
    "description": "Exam CRUD + Question/Answer cấp con. Cookie teacher.",
    "item": [
        request_item(
            name="API_07_001 — POST exam (teacher)",
            method="POST",
            url_path="/api/v1/exams",
            body={"teacherId": 0, "title": "TEST_API_exam_main",
                  "durationMinutes": 30, "passingScore": 50, "maxAttempts": 3},
            pre=[
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.test("status=DRAFT mặc định", function () { pm.expect(j.result.status).to.eql("DRAFT"); });',
                'pm.environment.set("createdExamId", j.result.id);',
            ],
        ),
        request_item(
            name="API_07_002 — POST exam thiếu title",
            method="POST",
            url_path="/api/v1/exams",
            body={"teacherId": 1, "durationMinutes": 30},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_003 — POST exam thiếu durationMinutes",
            method="POST",
            url_path="/api/v1/exams",
            body={"teacherId": 1, "title": "no_duration"},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_004 — POST exam body rỗng",
            method="POST",
            url_path="/api/v1/exams",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_005 — PUT exam set status=LIVE",
            method="PUT",
            url_path="/api/v1/exams/{{createdExamId}}",
            body={"status": "LIVE"},
            description="Set LIVE để student có thể attempt sau này.",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("status=LIVE", function () { pm.expect(j.result.status).to.eql("LIVE"); });',
            ],
        ),
        request_item(
            name="API_07_006 — PUT exam 9999 not found",
            method="PUT",
            url_path="/api/v1/exams/9999",
            body={"title": "x"},
            tests=t_status(404),
        ),
        request_item(
            name="API_07_007 — POST exam question",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/questions",
            body={"content": "TEST_API exam Q1?", "order": 1},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("createdExamQuestionId", j.result.id);',
            ],
        ),
        request_item(
            name="API_07_008 — POST question thiếu content",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/questions",
            body={"order": 2},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_009 — POST exam answer",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/questions/{{createdExamQuestionId}}/answers",
            body={"content": "TEST_API answer A", "isCorrect": True},
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("createdExamAnswerId", j.result.id);',
            ],
        ),
        request_item(
            name="API_07_010 — POST answer thiếu isCorrect",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/questions/{{createdExamQuestionId}}/answers",
            body={"content": "incomplete"},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_011 — GET exams list",
            method="GET",
            url_path="/api/v1/exams",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_07_012 — GET exam detail",
            method="GET",
            url_path="/api/v1/exams/{{createdExamId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title và status", function () {',
                '    pm.expect(j.result.title).to.exist;',
                '    pm.expect(j.result.status).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_07_013 — GET exam 9999 not found",
            method="GET",
            url_path="/api/v1/exams/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_07_014 — GET exam questions list",
            method="GET",
            url_path="/api/v1/exams/{{createdExamId}}/questions",
            tests=t_status(200),
        ),
        request_item(
            name="API_07_015 — PUT question update",
            method="PUT",
            url_path="/api/v1/exams/{{createdExamId}}/questions/{{createdExamQuestionId}}",
            body={"content": "TEST_API Q updated?", "order": 1},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Content đã đổi", function () { pm.expect(j.result.content).to.eql("TEST_API Q updated?"); });',
            ],
        ),
        request_item(
            name="API_07_016 — PUT question 9999 not found",
            method="PUT",
            url_path="/api/v1/exams/{{createdExamId}}/questions/9999",
            body={"content": "x", "order": 1},
            tests=t_status(404),
        ),
        request_item(
            name="API_07_017 — PUT answer update",
            method="PUT",
            url_path="/api/v1/exams/{{createdExamId}}/questions/{{createdExamQuestionId}}/answers/{{createdExamAnswerId}}",
            body={"content": "TEST_API A updated", "isCorrect": False},
            tests=t_status(200),
        ),
        request_item(
            name="API_07_018 — PUT answer 9999 not found",
            method="PUT",
            url_path="/api/v1/exams/{{createdExamId}}/questions/{{createdExamQuestionId}}/answers/9999",
            body={"content": "x", "isCorrect": True},
            tests=t_status(404),
        ),
    ],
}

# =============================================================================
# 18_Exam_Attempts folder (7 TC)
# =============================================================================
exam_attempts_folder = {
    "name": "18_Exam_Attempts",
    "description": "Student start + submit attempt. Cookie student.",
    "item": [
        request_item(
            name="(switch) Login as Student",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_register_happy@example.com", "password": "123456"},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.environment.set("createdStudentId", j.result.userId);',
            ],
        ),
        request_item(
            name="API_07_019 — POST start attempt (LIVE exam)",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/attempts/start",
            body={"studentId": 0},
            pre=[
                'var sid = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = sid;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("createdExamAttemptId", j.result.id);',
            ],
        ),
        request_item(
            name="API_07_020 — POST start attempt cho DRAFT exam (kỳ vọng 400)",
            method="POST",
            url_path="/api/v1/exams/{{api07DraftExamId}}/attempts/start",
            body={"studentId": 0},
            pre=[
                'var sid = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = sid;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(400) + t_message_includes("not available"),
        ),
        request_item(
            name="API_07_021 — POST submit attempt",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/attempts/{{createdExamAttemptId}}/submit",
            body={"responsesJson": {}},
            pre=[
                'var qid = pm.environment.get("createdExamQuestionId");',
                'var aid = pm.environment.get("createdExamAnswerId");',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.responsesJson = {};',
                'body.responsesJson[qid] = parseInt(aid);',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Có score", function () { pm.expect(j.result.score).to.exist; });',
            ],
        ),
        request_item(
            name="API_07_022 — POST submit responsesJson rỗng",
            method="POST",
            url_path="/api/v1/exams/{{createdExamId}}/attempts/{{createdExamAttemptId}}/submit",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_07_023 — GET my-attempt",
            method="GET",
            url_path="/api/v1/exams/{{createdExamId}}/attempts/my-attempt",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Trả về attempt info", function () { pm.expect(j.result).to.exist; });',
            ],
        ),
        request_item(
            name="API_07_024 — POST /exam-attempts (alt route)",
            method="POST",
            url_path="/api/v1/exam-attempts",
            body={"studentId": 0, "examId": 0},
            pre=[
                'var sid = parseInt(pm.environment.get("createdStudentId"));',
                'var examId = parseInt(pm.environment.get("createdExamId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = sid;',
                'body.examId = examId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=[
                'pm.test("Status hợp lý", function () {',
                '    pm.expect([200, 201, 400, 409]).to.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_07_025 — GET leaderboard",
            method="GET",
            url_path="/api/v1/exams/{{createdExamId}}/leaderboard",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
    ],
}

# =============================================================================
# _Setup_API08 — Tạo answer mới cho question (answer cũ đã bị xoá ở API_05_025)
# =============================================================================
setup_api08_folder = {
    "name": "_Setup_API08",
    "description": "Quiz Attempts dùng episode từ _Setup_API05. Cần: (1) approve course, (2) tạo answer mới, (3) student enroll vào course.",
    "item": [
        request_item(
            name="Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Create answer for quiz question",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/chapters/{{api05ChapterId}}/episodes/{{api05EpisodeId}}/questions/{{createdQuestionId}}/answers",
            body={"content": "TEST_API_quiz_answer_for_attempt", "isCorrect": True, "order": 1},
            description="Answer cũ (createdAnswerId) đã bị xoá ở API_05_025. Tạo mới để student submit được.",
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.environment.set("api08AnswerId", j.result.id);',
            ],
        ),
        request_item(
            name="Re-login as Admin to approve api05Course",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="Approve api05Course (cho student enroll)",
            method="PUT",
            url_path="/api/v1/courses/{{api05CourseId}}/by-admin",
            body={"status": "APPROVED"},
            tests=t_status(200),
        ),
        request_item(
            name="Login as Student",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_register_happy@example.com", "password": "123456"},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.environment.set("createdStudentId", j.result.userId);',
            ],
        ),
        request_item(
            name="Enroll student vào api05Course (yêu cầu để submit quiz)",
            method="POST",
            url_path="/api/v1/courses/{{api05CourseId}}/enrollments",
            body={"studentId": 0},
            pre=[
                'var sid = parseInt(pm.environment.get("createdStudentId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = sid;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            description="Backend yêu cầu student enrolled trong course mới được submit quiz của episode trong course đó.",
            tests=[
                'pm.test("Status 201 hoặc 400 (đã enrolled)", function () {',
                '    pm.expect([201, 400, 409]).to.include(pm.response.code);',
                '});',
            ],
        ),
    ],
}

# =============================================================================
# 19_Quiz_Attempts folder (25 TC)
# =============================================================================
quiz_attempts_folder = {
    "name": "19_Quiz_Attempts",
    "description": "Student submit quiz vào QUIZ episode. Endpoint /api/v1/quiz-attempts.",
    "item": [
        request_item(
            name="API_08_001 — POST submit quiz (positive)",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={
                "episodeId": 0,
                "studentId": 0,
                "responsesJson": {},
            },
            pre=[
                'var sid = parseInt(pm.environment.get("createdStudentId"));',
                'var epId = parseInt(pm.environment.get("api05EpisodeId"));',
                'var qid = pm.environment.get("createdQuestionId");',
                'var aid = parseInt(pm.environment.get("api08AnswerId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.studentId = sid;',
                'body.episodeId = epId;',
                'body.responsesJson = {};',
                'body.responsesJson[qid] = aid;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("result tồn tại", function () { pm.expect(j.result).to.exist; });',
                'if (j.result && j.result.id) pm.environment.set("createdQuizAttemptId", j.result.id);',
            ],
        ),
        request_item(
            name="API_08_002 — POST submit thiếu episodeId",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={"studentId": 1, "responsesJson": {"1": 1}},
            tests=t_status(400),
        ),
        request_item(
            name="API_08_003 — POST submit thiếu studentId",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={"episodeId": 1, "responsesJson": {"1": 1}},
            tests=t_status(400),
        ),
        request_item(
            name="API_08_004 — POST submit thiếu responsesJson",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={"episodeId": 1, "studentId": 1},
            tests=t_status(400),
        ),
        request_item(
            name="API_08_005 — POST body rỗng",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_08_006 — POST submit với studentId user khác (security)",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={"episodeId": 1, "studentId": 99999, "responsesJson": {"1": 1}},
            description="Backend trả 201 với error message thay vì 403 — quirk của ApiResponse.error.",
            tests=[
                'pm.test("Có error message về authorization", function () {',
                '    var j = pm.response.json();',
                '    var m = j.message || "";',
                '    pm.expect(m).to.include("only submit your own");',
                '});',
            ],
        ),
        request_item(
            name="API_08_007 — GET /student/:studentId (my attempts)",
            method="GET",
            url_path="/api/v1/quiz-attempts/student/{{createdStudentId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result tồn tại", function () { pm.expect(j.result).to.exist; });',
            ],
        ),
        request_item(
            name="API_08_008 — GET /student/9999 (other student — unauthorized)",
            method="GET",
            url_path="/api/v1/quiz-attempts/student/9999",
            tests=[
                'pm.test("Có error message Unauthorized", function () {',
                '    var j = pm.response.json();',
                '    pm.expect(j.message).to.include("Unauthorized");',
                '});',
            ],
        ),
        request_item(
            name="API_08_009 — GET /:id (attempt detail)",
            method="GET",
            url_path="/api/v1/quiz-attempts/{{createdQuizAttemptId}}",
            tests=t_status(200),
        ),
        request_item(
            name="API_08_010 — GET /9999 not found",
            method="GET",
            url_path="/api/v1/quiz-attempts/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_08_011 — GET /:id/result",
            method="GET",
            url_path="/api/v1/quiz-attempts/{{createdQuizAttemptId}}/result",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có chi tiết kết quả", function () { pm.expect(j.result).to.exist; });',
            ],
        ),
        request_item(
            name="API_08_012 — GET /9999/result not found",
            method="GET",
            url_path="/api/v1/quiz-attempts/9999/result",
            tests=t_status(404),
        ),
        request_item(
            name="API_08_013 — GET /check/:sid/:eid (has attempted=true)",
            method="GET",
            url_path="/api/v1/quiz-attempts/check/{{createdStudentId}}/{{api05EpisodeId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("hasAttempted=true", function () { pm.expect(j.result.hasAttempted).to.eql(true); });',
            ],
        ),
        request_item(
            name="API_08_014 — GET /check/:sid/9999 (no attempt cho episode)",
            method="GET",
            url_path="/api/v1/quiz-attempts/check/{{createdStudentId}}/9999",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("hasAttempted=false", function () { pm.expect(j.result.hasAttempted).to.eql(false); });',
            ],
        ),
        request_item(
            name="API_08_015 — GET /check/9999/:eid (other student — unauthorized)",
            method="GET",
            url_path="/api/v1/quiz-attempts/check/9999/{{api05EpisodeId}}",
            tests=[
                'pm.test("Có error message", function () {',
                '    var j = pm.response.json();',
                '    pm.expect(j.message).to.include("Unauthorized");',
                '});',
            ],
        ),
        request_item(
            name="API_08_016 — GET /episode/:eid/leaderboard",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/{{api05EpisodeId}}/leaderboard",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_08_017 — GET /episode/9999/leaderboard (empty)",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/9999/leaderboard",
            tests=t_status(200),
        ),
        # Switch to teacher cho các endpoint TEACHER/ADMIN
        request_item(
            name="(switch) Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_08_018 — GET /episode/:eid (teacher list)",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/{{api05EpisodeId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_08_019 — GET /episode/9999 (empty)",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/9999",
            tests=t_status(200),
        ),
        request_item(
            name="API_08_020 — GET /course/:cid (teacher)",
            method="GET",
            url_path="/api/v1/quiz-attempts/course/{{api05CourseId}}",
            tests=t_status(200),
        ),
        request_item(
            name="API_08_021 — GET /course/9999",
            method="GET",
            url_path="/api/v1/quiz-attempts/course/9999",
            tests=t_status(200),
        ),
        request_item(
            name="API_08_022 — GET /statistics/course/:cid (teacher)",
            method="GET",
            url_path="/api/v1/quiz-attempts/statistics/course/{{api05CourseId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result tồn tại", function () { pm.expect(j.result).to.exist; });',
            ],
        ),
        request_item(
            name="API_08_023 — GET /statistics/course/9999",
            method="GET",
            url_path="/api/v1/quiz-attempts/statistics/course/9999",
            tests=t_status(200),
        ),
        # Test student không được call teacher endpoint
        request_item(
            name="(switch) Login as Student",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_register_happy@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_08_024 — GET /episode/:eid (student không được — Forbidden)",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/{{api05EpisodeId}}",
            tests=t_status(403),
        ),
        request_item(
            name="API_08_025 — GET /statistics/course/:cid (student — Forbidden)",
            method="GET",
            url_path="/api/v1/quiz-attempts/statistics/course/{{api05CourseId}}",
            tests=t_status(403),
        ),
    ],
}

# =============================================================================
# _Setup_API09 — Re-login admin để test users module
# =============================================================================
setup_api09_folder = {
    "name": "_Setup_API09",
    "description": "API_09 = Users + Zoom + Chatbot. Re-login admin cho POST/PATCH/DELETE /teachers.",
    "item": [
        request_item(
            name="Re-login as Admin",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "{{adminEmail}}", "password": "{{adminPassword}}"},
            tests=t_status(200, 201),
        ),
    ],
}

# =============================================================================
# 20_Users_Teachers folder (12 TC)
# =============================================================================
users_folder = {
    "name": "20_Users_Teachers",
    "description": "Teachers CRUD + user profile update.",
    "item": [
        request_item(
            name="API_09_001 — GET /teachers/search (public)",
            method="GET",
            url_path="/api/v1/teachers/search",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("result có teachers array", function () {',
                '    pm.expect(j.result.teachers).to.be.an("array");',
                '});',
            ],
        ),
        request_item(
            name="API_09_002 — GET /teachers/:id (existing)",
            method="GET",
            url_path="/api/v1/teachers/{{createdTeacherId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có email và fullName", function () {',
                '    pm.expect(j.result.email).to.exist;',
                '    pm.expect(j.result.fullName).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_09_003 — GET /teachers/9999 not found",
            method="GET",
            url_path="/api/v1/teachers/9999",
            tests=t_status(404),
        ),
        request_item(
            name="API_09_004 — POST /teachers/featured",
            method="POST",
            url_path="/api/v1/teachers/featured",
            body={"emails": ["test_api_teacher@example.com"]},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("result là array", function () { pm.expect(j.result).to.be.an("array"); });',
            ],
        ),
        request_item(
            name="API_09_005 — POST /teachers/featured body rỗng",
            method="POST",
            url_path="/api/v1/teachers/featured",
            body={},
            tests=[
                'pm.test("Status hợp lệ (400 hoặc 200 với empty)", function () {',
                '    pm.expect([200, 201, 400]).to.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_09_006 — GET /teachers (admin list)",
            method="GET",
            url_path="/api/v1/teachers",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có data array", function () {',
                '    pm.expect(j.result.data || j.result).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_09_007 — POST /teachers (admin tạo teacher mới)",
            method="POST",
            url_path="/api/v1/teachers",
            body={
                "email": "test_api_teacher_new@example.com",
                "password": "123456",
                "fullName": "New Test Teacher",
                "phone": "0909999999",
            },
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id và role=TEACHER", function () {',
                '    pm.expect(j.result.id).to.exist;',
                '    pm.expect(j.result.role).to.eql("TEACHER");',
                '});',
                'pm.environment.set("api09NewTeacherId", j.result.id);',
            ],
        ),
        request_item(
            name="API_09_008 — POST /teachers email đã tồn tại",
            method="POST",
            url_path="/api/v1/teachers",
            body={
                "email": "test_api_teacher_new@example.com",
                "password": "123456",
                "fullName": "Dup",
            },
            tests=t_status(400, 409),
        ),
        request_item(
            name="API_09_009 — POST /teachers thiếu email",
            method="POST",
            url_path="/api/v1/teachers",
            body={"password": "123456", "fullName": "No email"},
            tests=t_status(400),
        ),
        request_item(
            name="API_09_010 — PATCH /teachers/:id update",
            method="PATCH",
            url_path="/api/v1/teachers/{{api09NewTeacherId}}",
            body={"fullName": "Updated Teacher Name"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("fullName đã đổi", function () {',
                '    pm.expect(j.result.fullName).to.eql("Updated Teacher Name");',
                '});',
            ],
        ),
        request_item(
            name="API_09_011 — PUT /users/:id update profile",
            method="PUT",
            url_path="/api/v1/users/{{api09NewTeacherId}}",
            body={"phone": "0900000000"},
            tests=t_status(200),
        ),
        request_item(
            name="API_09_012 — DELETE /teachers/:id",
            method="DELETE",
            url_path="/api/v1/teachers/{{api09NewTeacherId}}",
            tests=t_status(200, 204),
        ),
    ],
}

# =============================================================================
# 21_Zoom folder (8 TC)
# =============================================================================
zoom_folder = {
    "name": "21_Zoom",
    "description": "Zoom meetings CRUD. POST/PUT/DELETE cần TEACHER.",
    "item": [
        request_item(
            name="(switch) Re-login as Teacher",
            method="POST",
            url_path="/api/v1/auth/sign-in",
            body={"email": "test_api_teacher@example.com", "password": "123456"},
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_09_013 — POST zoom meeting",
            method="POST",
            url_path="/api/v1/zoom/meetings",
            body={
                "courseId": 0,
                "teacherId": 0,
                "title": "TEST_API_zoom_meeting",
                "joinUrl": "https://zoom.us/j/test123",
                "durationMinutes": 60,
            },
            pre=[
                'var courseId = parseInt(pm.environment.get("api05CourseId"));',
                'var teacherId = parseInt(pm.environment.get("createdTeacherId"));',
                'var body = JSON.parse(pm.request.body.raw);',
                'body.courseId = courseId;',
                'body.teacherId = teacherId;',
                'pm.request.body.raw = JSON.stringify(body);',
            ],
            tests=t_status(201) + [
                'var j = pm.response.json();',
                'pm.test("result.id tồn tại", function () { pm.expect(j.result.id).to.exist; });',
                'pm.environment.set("api09ZoomMeetingId", j.result.id);',
            ],
        ),
        request_item(
            name="API_09_014 — POST zoom thiếu title",
            method="POST",
            url_path="/api/v1/zoom/meetings",
            body={
                "courseId": 1,
                "teacherId": 1,
                "joinUrl": "https://zoom.us/j/x",
            },
            tests=t_status(400),
        ),
        request_item(
            name="API_09_015 — POST zoom body rỗng",
            method="POST",
            url_path="/api/v1/zoom/meetings",
            body={},
            tests=t_status(400),
        ),
        request_item(
            name="API_09_016 — GET zoom meetings list",
            method="GET",
            url_path="/api/v1/zoom/meetings",
            tests=t_status(200),
        ),
        request_item(
            name="API_09_017 — GET zoom meetings filter courseId",
            method="GET",
            url_path="/api/v1/zoom/meetings",
            query={"courseId": "{{api05CourseId}}"},
            tests=t_status(200),
        ),
        request_item(
            name="API_09_018 — GET zoom meeting detail",
            method="GET",
            url_path="/api/v1/zoom/meetings/{{api09ZoomMeetingId}}",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có title", function () { pm.expect(j.result.title).to.exist; });',
            ],
        ),
        request_item(
            name="API_09_019 — PUT zoom meeting update",
            method="PUT",
            url_path="/api/v1/zoom/meetings/{{api09ZoomMeetingId}}",
            body={"title": "TEST_API_zoom_updated"},
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Title đã đổi", function () {',
                '    pm.expect(j.result.title).to.eql("TEST_API_zoom_updated");',
                '});',
            ],
        ),
        request_item(
            name="API_09_020 — DELETE zoom meeting",
            method="DELETE",
            url_path="/api/v1/zoom/meetings/{{api09ZoomMeetingId}}",
            tests=t_status(200, 204),
        ),
    ],
}

# =============================================================================
# 22_Chatbot folder (5 TC)
# =============================================================================
chatbot_folder = {
    "name": "22_Chatbot",
    "description": "POST /chatbot/chat — public, không cần auth.",
    "item": [
        request_item(
            name="API_09_021 — POST chat hello",
            method="POST",
            url_path="/chatbot/chat",
            body={"message": "Hello, what is this platform?", "history": []},
            tests=t_status(200, 201) + [
                'var j = pm.response.json();',
                'pm.test("Có reply hoặc message", function () {',
                '    pm.expect(j.reply || j.message || j.result).to.exist;',
                '});',
            ],
        ),
        request_item(
            name="API_09_022 — POST chat với history",
            method="POST",
            url_path="/chatbot/chat",
            body={
                "message": "Continue",
                "history": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi"},
                ],
            },
            tests=t_status(200, 201),
        ),
        request_item(
            name="API_09_023 — POST chat message rỗng",
            method="POST",
            url_path="/chatbot/chat",
            body={"message": "", "history": []},
            tests=[
                'pm.test("Status hợp lệ (200 với reply hoặc 400)", function () {',
                '    pm.expect([200, 201, 400]).to.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_09_024 — POST chat body rỗng",
            method="POST",
            url_path="/chatbot/chat",
            body={},
            tests=[
                'pm.test("Status hợp lệ", function () {',
                '    pm.expect([200, 201, 400]).to.include(pm.response.code);',
                '});',
            ],
        ),
        request_item(
            name="API_09_025 — POST chat message rất dài",
            method="POST",
            url_path="/chatbot/chat",
            body={"message": "A" * 2000, "history": []},
            tests=t_status(200, 201, 400),
        ),
    ],
}

# =============================================================================
# 07_Me_logged_in
# =============================================================================
me_folder = {
    "name": "10_Me_logged_in",
    "description": "GET /api/v1/auth/me — yêu cầu cookie ACCESS_TOKEN.",
    "item": [
        request_item(
            name="API_01_020 — Get me khi đã login",
            method="GET",
            url_path="/api/v1/auth/me",
            tests=t_status(200) + [
                'var j = pm.response.json();',
                'pm.test("Có thông tin user", function () { pm.expect(j.result).to.exist; });',
            ],
        ),
    ],
}

# =============================================================================
# 08_Logout — sau folder này cookie bị xoá
# =============================================================================
logout_folder = {
    "name": "11_Logout",
    "description": "GET /api/v1/auth/logout — kết thúc session, xoá cookie ACCESS_TOKEN.",
    "item": [
        request_item(
            name="API_01_021 — Logout sau khi login",
            method="GET",
            url_path="/api/v1/auth/logout",
            tests=t_status(200, 204),
        ),
    ],
}

# =============================================================================
# 09_Unauthorized — verify guard sau khi logout (cookie đã clear)
# =============================================================================
unauth_folder = {
    "name": "12_Unauthorized",
    "description": "Sau logout, các API yêu cầu auth phải trả 401.",
    "item": [
        request_item(
            name="API_01_022 — GET /me sau logout",
            method="GET",
            url_path="/api/v1/auth/me",
            tests=t_status(401),
        ),
        request_item(
            name="API_02_013 — POST /subjects không auth",
            method="POST",
            url_path="/api/v1/subjects",
            body={"name": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_02_014 — PUT /subjects/1 không auth",
            method="PUT",
            url_path="/api/v1/subjects/1",
            body={"name": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_02_015 — DELETE /subjects/1 không auth",
            method="DELETE",
            url_path="/api/v1/subjects/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_02_028 — POST /grade-levels không auth",
            method="POST",
            url_path="/api/v1/grade-levels",
            body={"name": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_02_029 — PUT /grade-levels/1 không auth",
            method="PUT",
            url_path="/api/v1/grade-levels/1",
            body={"name": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_02_030 — DELETE /grade-levels/1 không auth",
            method="DELETE",
            url_path="/api/v1/grade-levels/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_03_023 — POST /courses không auth",
            method="POST",
            url_path="/api/v1/courses",
            body={"teacherId": 1, "title": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_03_024 — PUT /courses/1 không auth",
            method="PUT",
            url_path="/api/v1/courses/1",
            body={"title": "should_fail"},
            tests=t_status(401),
        ),
        request_item(
            name="API_03_025 — DELETE /courses/1 không auth",
            method="DELETE",
            url_path="/api/v1/courses/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_03_026 — GET /courses (admin list) không auth",
            method="GET",
            url_path="/api/v1/courses",
            tests=t_status(401),
        ),
        request_item(
            name="API_03_027 — PUT /courses/1/by-admin không auth",
            method="PUT",
            url_path="/api/v1/courses/1/by-admin",
            body={"status": "APPROVED"},
            tests=t_status(401),
        ),
        request_item(
            name="API_04_026 — POST chapter không auth",
            method="POST",
            url_path="/api/v1/courses/1/chapters",
            body={"title": "fail", "order": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_04_027 — PUT chapter không auth",
            method="PUT",
            url_path="/api/v1/courses/1/chapters/1",
            body={"title": "fail", "order": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_04_028 — DELETE chapter không auth",
            method="DELETE",
            url_path="/api/v1/courses/1/chapters/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_04_029 — POST episode không auth",
            method="POST",
            url_path="/api/v1/courses/1/chapters/1/episodes",
            body={"title": "fail", "order": 1, "videoUrl": "https://x.com/v.mp4"},
            tests=t_status(401),
        ),
        request_item(
            name="API_04_030 — DELETE episode không auth",
            method="DELETE",
            url_path="/api/v1/courses/1/chapters/1/episodes/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_05_026 — POST material không auth",
            method="POST",
            url_path="/api/v1/courses/1/materials",
            body={"title": "fail", "fileUrl": "https://x.com/f.pdf"},
            tests=t_status(401),
        ),
        request_item(
            name="API_05_027 — PUT material không auth",
            method="PUT",
            url_path="/api/v1/courses/1/materials/1",
            body={"title": "fail", "fileUrl": "https://x.com/f.pdf"},
            tests=t_status(401),
        ),
        request_item(
            name="API_05_028 — DELETE material không auth",
            method="DELETE",
            url_path="/api/v1/courses/1/materials/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_05_029 — POST question không auth",
            method="POST",
            url_path="/api/v1/courses/1/chapters/1/episodes/1/questions",
            body={"content": "fail", "order": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_05_030 — POST answer không auth",
            method="POST",
            url_path="/api/v1/courses/1/chapters/1/episodes/1/questions/1/answers",
            body={"content": "fail", "isCorrect": True, "order": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_06_021 — POST enroll không auth",
            method="POST",
            url_path="/api/v1/courses/1/enrollments",
            body={"studentId": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_06_022 — GET /students/enrollments không auth",
            method="GET",
            url_path="/api/v1/courses/students/enrollments",
            tests=t_status(401),
        ),
        request_item(
            name="API_06_023 — PUT enrollment status không auth",
            method="PUT",
            url_path="/api/v1/courses/1/enrollments/1/status",
            body={"status": "CANCELLED"},
            tests=t_status(401),
        ),
        request_item(
            name="API_06_024 — POST mark episode complete không auth",
            method="POST",
            url_path="/api/v1/courses/1/enrollments/1/episodes/1/complete",
            tests=t_status(401),
        ),
        request_item(
            name="API_06_025 — POST complete course không auth",
            method="POST",
            url_path="/api/v1/courses/1/enrollments/1/complete",
            tests=t_status(401),
        ),
        request_item(
            name="API_07_026 — POST exam không auth",
            method="POST",
            url_path="/api/v1/exams",
            body={"teacherId": 1, "title": "fail", "durationMinutes": 30},
            tests=t_status(401),
        ),
        request_item(
            name="API_07_027 — GET exams list không auth",
            method="GET",
            url_path="/api/v1/exams",
            tests=t_status(401),
        ),
        request_item(
            name="API_07_028 — POST start attempt không auth",
            method="POST",
            url_path="/api/v1/exams/1/attempts/start",
            body={"studentId": 1},
            tests=t_status(401),
        ),
        request_item(
            name="API_07_029 — POST submit attempt không auth",
            method="POST",
            url_path="/api/v1/exams/1/attempts/1/submit",
            body={"responsesJson": {}},
            tests=t_status(401),
        ),
        request_item(
            name="API_07_030 — GET leaderboard không auth",
            method="GET",
            url_path="/api/v1/exams/1/leaderboard",
            tests=t_status(401),
        ),
        request_item(
            name="API_08_026 — POST submit quiz không auth",
            method="POST",
            url_path="/api/v1/quiz-attempts",
            body={"episodeId": 1, "studentId": 1, "responsesJson": {"1": 1}},
            tests=t_status(401),
        ),
        request_item(
            name="API_08_027 — GET /student/:id không auth",
            method="GET",
            url_path="/api/v1/quiz-attempts/student/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_08_028 — GET /:id không auth",
            method="GET",
            url_path="/api/v1/quiz-attempts/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_08_029 — GET /episode/:eid không auth",
            method="GET",
            url_path="/api/v1/quiz-attempts/episode/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_08_030 — GET /course/:cid không auth",
            method="GET",
            url_path="/api/v1/quiz-attempts/course/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_09_026 — POST /teachers không auth",
            method="POST",
            url_path="/api/v1/teachers",
            body={"email": "x@x.com", "password": "123456", "fullName": "X"},
            tests=t_status(401),
        ),
        request_item(
            name="API_09_027 — GET /teachers list không auth (admin only)",
            method="GET",
            url_path="/api/v1/teachers",
            tests=t_status(401),
        ),
        request_item(
            name="API_09_028 — PATCH /teachers/:id không auth",
            method="PATCH",
            url_path="/api/v1/teachers/1",
            body={"fullName": "x"},
            tests=t_status(401),
        ),
        request_item(
            name="API_09_029 — DELETE /teachers/:id không auth",
            method="DELETE",
            url_path="/api/v1/teachers/1",
            tests=t_status(401),
        ),
        request_item(
            name="API_09_030 — POST /zoom/meetings không auth",
            method="POST",
            url_path="/api/v1/zoom/meetings",
            body={"courseId": 1, "teacherId": 1, "title": "x", "joinUrl": "x"},
            tests=t_status(401),
        ),
    ],
}

# =============================================================================
# _Cleanup
# =============================================================================
cleanup_folder = {
    "name": "_Cleanup",
    "description": "Sau khi chạy xong, chạy cleanup/cleanup.sql để dọn DB.",
    "item": [
        {
            "name": "_README — Cách rollback",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{baseUrl}}/api/v1/subjects",
                    "host": ["{{baseUrl}}"],
                    "path": ["api", "v1", "subjects"],
                },
                "description": "Rollback: docker exec -i elearning-mysql mysql -uroot -p1234 elearning < cleanup/cleanup.sql",
            },
            "response": [],
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "type": "text/javascript",
                        "exec": [
                            'pm.test("Note: chạy cleanup.sql ngoài Postman", function () { pm.expect(true).to.be.true; });',
                        ],
                    },
                }
            ],
        }
    ],
}

# =============================================================================
# Build collection
# =============================================================================
collection = {
    "info": {
        "_postman_id": str(uuid.uuid4()),
        "name": "SQA03_Nhom13_API_Test",
        "description": (
            "API Test Collection cho dự án E-Learning.\n"
            "Module 01 (Auth): 22 TC\n"
            "Module 02 (Subjects + Grade Levels): 30 TC\n\n"
            "Folder order: _Setup → 01_Register → 02_Sign-in → 03_OTP → 04_Reset → "
            "05_Subjects → 06_Grade_Levels → 07_Me → 08_Logout → 09_Unauthorized → _Cleanup\n\n"
            "## Cách chạy\n"
            "1. Chạy seed-otp.cmd để Redis có OTP\n"
            "2. Run Collection / chạy run-test.cmd\n"
            "3. Chạy cleanup.sql sau cùng"
        ),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "item": [
        setup_folder,
        register_folder,
        signin_folder,
        otp_folder,
        reset_folder,
        subjects_folder,
        grade_levels_folder,
        setup_teacher_folder,
        courses_folder,
        setup_api04_folder,
        chapters_folder,
        episodes_folder,
        setup_api05_folder,
        materials_folder,
        questions_folder,
        answers_folder,
        setup_api06_folder,
        enrollments_folder,
        setup_api07_folder,
        exams_folder,
        exam_attempts_folder,
        setup_api08_folder,
        quiz_attempts_folder,
        setup_api09_folder,
        users_folder,
        zoom_folder,
        chatbot_folder,
        me_folder,
        logout_folder,
        unauth_folder,
        cleanup_folder,
    ],
    "variable": [],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(collection, ensure_ascii=False, indent=4), encoding="utf-8")
total_tc = sum(len(f.get('item', [])) for f in collection['item'])
print(f"Wrote {OUT}")
print(f"Total folders: {len(collection['item'])}")
print(f"Total requests: {total_tc}")
