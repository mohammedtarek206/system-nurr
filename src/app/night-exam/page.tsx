import AccessProtectedPage from "@/components/AccessProtectedPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ليلة الامتحان | أكاديمية التدريب والتمريض",
    description: "الوصول المباشر لمراجعات وامتحانات ليلة الامتحان المعتمدة",
};

export default function NightExamPage() {
    return (
        <AccessProtectedPage
            pageType="NIGHT_EXAM"
            title="ليلة الامتحان - المراجعات النهائية والامتحانات"
            subtitle="برنامج المراجعة الشاملة ليلة الامتحان لطلاب التمريض والتأهيل الطبي"
            description="أدخل كود الوصول الخاص بليلة الامتحان لتأكيد حجز مقعدك والوصول للمحتوى التدريبي والاختبارات التقييمية المباشرة."
            badgeText="مراجعات ليلة الامتحان 🌙"
            accentColor="amber"
        />
    );
}
