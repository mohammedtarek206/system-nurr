import AccessProtectedPage from "@/components/AccessProtectedPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "NCLEX Exam Access | أكاديمية التدريب والتمريض",
    description: "الوصول المباشر لاختبارات ومحتوى NCLEX الدولي",
};

export default function NclexPage() {
    return (
        <AccessProtectedPage
            pageType="NCLEX"
            title="NCLEX International Nursing Exam"
            subtitle="نظام التأهيل والتدريب الشامل لاجتياز امتحانات المعادلة والترخيص الدولي NCLEX"
            description="أدخل كود الوصول المخصص لدورة واختبارات NCLEX لحجز موعد الامتحان والوصول لبنك الأسئلة والمحاضرات."
            badgeText="ترخيص NCLEX الدولي 🩺"
            accentColor="blue"
        />
    );
}
