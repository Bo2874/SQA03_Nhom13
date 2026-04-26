"use client";

import Image from "next/image";
import Link from "next/link";

export default function ParentExpectations() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-wide">
            PHỤ HUYNH MONG MUỐN
          </h2>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-[2px] w-16 bg-primary-400 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-800 rotate-45"></div>
            <div className="w-3 h-3 bg-primary-800 rotate-45"></div>
            <div className="w-3 h-3 bg-primary-800 rotate-45"></div>
            <div className="h-[2px] w-16 bg-primary-400 rounded-full"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {[
              "Nắm vững kiến thức cơ bản, xây dựng nền tảng vững chắc cho con từ lớp 1 đến lớp 12",
              "Tìm được giáo viên giỏi, tận tâm, có phương pháp giảng dạy hiệu quả và dễ hiểu",
              "Được học với giáo viên giàu kinh nghiệm, hơn 20 năm giảng dạy, giúp nhiều học sinh đạt thành tích cao",
              "Tìm được lộ trình học đúng đắn để con bắt kịp kiến thức và nâng cao điểm số",
              "Có người theo dõi, hỗ trợ và đánh giá quá trình học tập của con thường xuyên",
              "Tìm được nền tảng học uy tín, phương pháp khoa học, giúp con tự tin học tập và phát triển toàn diện",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-300 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold">✓</span>
                </div>
                <p className="text-base text-slate-700 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}

            {/* Quote */}
            <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-l-4 border-emerald-500 shadow-md mt-8">
              <p className="text-slate-600 italic text-base leading-relaxed">
                Phụ huynh đừng lo! Nền tảng của chúng tôi thấu hiểu những mong muốn đó và đã
                cùng đội ngũ giáo viên xây dựng phương pháp học tập khoa học, hiệu quả,
                giúp con đạt kết quả tốt nhất trong năm học mới.
              </p>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <Link
                href="/courses"
                className="inline-flex items-center gap-3 text-green-500 font-bold px-9 py-4 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
              >
                ĐĂNG KÝ HỌC THỬ
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-indigo-100">
              <Image
                src="https://amis.misa.vn/wp-content/uploads/2022/12/xay-dung-doi-ngu-trong-doanh-nghiep.jpg"
                alt="Teachers Group"
                width={600}
                height={450}
                className="object-cover"
              />
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-400 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-400 rounded-full opacity-20 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
