"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Video as VideoIcon, Edit, Eye, Search, CheckCircle, XCircle, AlertTriangle, X, ExternalLink, Loader2, Layers, Award, Lock } from "lucide-react";

export default function VideosManager() {
  const [videos, setVideos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Form & Edit state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Quick Add Section Modal State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDesc, setNewSectionDesc] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Modals
  const [deleteModalVideo, setDeleteModalVideo] = useState<any>(null);
  const [previewVideo, setPreviewVideo] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSectionsList, setFilterSectionsList] = useState<any[]>([]);

  const initialFormState = {
    title: "",
    description: "",
    platform: "ZOOM" as "ZOOM" | "FREE_CONFERENCE" | "VIDEO",
    url: "",
    thumbnail: "",
    duration: "",
    courseId: "",
    sectionId: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    targetType: "all" as "all" | "specific",
    targetSpecializations: [] as string[],
    status: "published" as "published" | "draft" | "archived" | "hidden",
    order: 0,
    prerequisiteType: "NONE" as "NONE" | "LESSON" | "EXAM",
    prerequisiteExamId: "",
    examId: "",
    passingPercentage: 80
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes, specRes, exmRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/admin/courses"),
        fetch("/api/admin/specializations"),
        fetch("/api/admin/exams")
      ]);
      const vData = await vRes.json();
      const cData = await cRes.json();
      const specData = await specRes.json();
      const exmData = await exmRes.json();

      setVideos(Array.isArray(vData) ? vData : []);
      setCourses(Array.isArray(cData) ? cData : []);
      setSpecializations(Array.isArray(specData) ? specData : []);
      setExams(Array.isArray(exmData) ? exmData : []);
    } catch (err) {
      console.error("Fetch data error:", err);
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsForCourse = async (courseId: string) => {
    if (!courseId) {
      setSections([]);
      return;
    }
    setSectionsLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections`);
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch sections error:", err);
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterCourseChange = async (cId: string) => {
    setFilterCourse(cId);
    setFilterSection("");
    if (!cId) {
      setFilterSectionsList([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/courses/${cId}/sections`);
      const data = await res.json();
      setFilterSectionsList(Array.isArray(data) ? data : []);
    } catch {
      setFilterSectionsList([]);
    }
  };

  const handleCourseChange = (cId: string) => {
    setFormData(prev => ({ ...prev, courseId: cId, sectionId: "" }));
    fetchSectionsForCourse(cId);
  };

  const validateUrl = (urlStr: string) => {
    if (!urlStr || !urlStr.trim()) return false;
    try {
      const parsed = new URL(urlStr.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleOpenNewForm = () => {
    setErrorMsg("");
    setEditingId(null);
    if (courses.length > 0) {
      const defaultCourseId = courses[0]._id;
      setFormData({
        ...initialFormState,
        courseId: defaultCourseId,
        sectionId: ""
      });
      fetchSectionsForCourse(defaultCourseId);
    } else {
      setFormData(initialFormState);
      setSections([]);
    }
    setShowForm(true);
  };

  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    if (!formData.courseId) {
      alert("من فضلك اختر الكورس أولاً");
      return;
    }

    setSavingSection(true);
    try {
      const res = await fetch(`/api/admin/courses/${formData.courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSectionTitle.trim(), description: newSectionDesc.trim() })
      });
      if (res.ok) {
        const createdSec = await res.json();
        setNewSectionTitle("");
        setNewSectionDesc("");
        setShowAddSectionModal(false);
        showToast("تم إضافة القسم بنجاح وتحديده للمحاضرة");
        await fetchSectionsForCourse(formData.courseId);
        if (createdSec?._id) {
          setFormData(prev => ({ ...prev, sectionId: createdSec._id }));
        }
      } else {
        alert("حدث خطأ أثناء إضافة القسم");
      }
    } catch (err) {
      console.error(err);
      alert("تعذر الاتصال بالسيرفر لإضافة القسم");
    } finally {
      setSavingSection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Course validation
    if (!formData.courseId || !formData.courseId.trim()) {
      setErrorMsg("من فضلك اختر الكورس أولاً");
      return;
    }

    // 2. Section validation
    if (!formData.sectionId || !formData.sectionId.trim() || formData.sectionId === "") {
      setErrorMsg("من فضلك اختر القسم الذي ستضاف إليه المحاضرة");
      return;
    }

    // 3. Title validation
    if (!formData.title || !formData.title.trim()) {
      setErrorMsg("من فضلك أدخل عنوان المحاضرة");
      return;
    }

    // 4. URL validation
    if (!validateUrl(formData.url)) {
      setErrorMsg("يرجى إدخال رابط صحيح للمحاضرة يبدأ بـ https://");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoType: formData.platform.toLowerCase(),
          videoUrl: formData.url,
          youtubeUrl: formData.url
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && data.message)) {
        let msg = data.message || "حدث خطأ أثناء الحفظ";
        if (msg.includes("Cast to ObjectId failed")) {
          msg = "حدث خطأ في بيانات القسم، برجاء اختيار القسم مرة أخرى.";
        }
        throw new Error(msg);
      }

      showToast(editingId ? "تم تحديث المحاضرة بنجاح" : "تم إضافة المحاضرة بنجاح");
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "تعذر حفظ المحاضرة، يرجى مراجعة البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (video: any) => {
    setEditingId(video._id);
    setErrorMsg("");
    const cId = video.courseId?._id || video.courseId || "";
    const secId = video.sectionId?._id || video.sectionId || "";
    let plat = (video.platform || video.videoType || 'ZOOM').toString().toUpperCase();
    if (plat === 'FREECONFERENCE' || plat === 'FREE_CONFERENCE' || plat === 'FREE CONFERENCE') plat = 'FREE_CONFERENCE';
    else if (plat !== 'FREE_CONFERENCE' && plat !== 'VIDEO') plat = 'ZOOM';

    setFormData({
      title: video.title || "",
      description: video.description || "",
      platform: plat as any,
      url: video.url || video.videoUrl || video.youtubeUrl || "",
      thumbnail: video.thumbnail || "",
      duration: video.duration || "",
      courseId: cId,
      sectionId: secId,
      startDate: video.startDate || "",
      startTime: video.startTime || "",
      endDate: video.endDate || "",
      endTime: video.endTime || "",
      targetType: video.targetType || "all",
      targetSpecializations: (video.targetSpecializations || []).map((s: any) => s._id || s),
      status: video.status || "published",
      order: video.order || 0,
      prerequisiteType: video.prerequisiteType || "NONE",
      prerequisiteExamId: video.prerequisiteExamId?._id || video.prerequisiteExamId || "",
      examId: video.examId?._id || video.examId || "",
      passingPercentage: video.passingPercentage || 80
    });
    if (cId) fetchSectionsForCourse(cId);
    setShowForm(true);
  };

  const handleToggleStatus = async (video: any) => {
    const newStatus = video.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/videos/${video._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`تم تغيير حالة المحاضرة إلى ${newStatus === 'published' ? 'منشورة' : 'مسودة'}`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
      showToast("حدث خطأ أثناء تغيير الحالة", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalVideo) return;
    try {
      const res = await fetch(`/api/admin/videos/${deleteModalVideo._id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteModalVideo(null);
        showToast("تم حذف المحاضرة بنجاح");
        fetchData();
      } else {
        showToast("تعذر حذف المحاضرة", "error");
      }
    } catch (err) {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  const filteredVideos = videos.filter(v => {
    const titleMatch = !search || v.title?.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    const courseMatch = !filterCourse || (v.courseId?._id || v.courseId) === filterCourse;
    const sectionMatch = !filterSection || (v.sectionId?._id || v.sectionId) === filterSection;
    const platformMatch = !filterPlatform || (v.platform || v.videoType?.toUpperCase()) === filterPlatform.toUpperCase();
    const statusMatch = !filterStatus || v.status === filterStatus;
    const specMatch = !filterSpecialization || (
      v.targetType === 'all' ||
      (v.targetSpecializations && v.targetSpecializations.some((s: any) => (s._id || s) === filterSpecialization))
    );
    return titleMatch && courseMatch && sectionMatch && platformMatch && statusMatch && specMatch;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 border text-sm transition-all animate-bounce ${toast.type === 'success' ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'
          }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
            <VideoIcon className="w-6 h-6 text-primary" />
            إدارة المحاضرات، الامتحانات المرتبطة وشروط التسلسل
          </h2>
          <p className="text-gray-500 text-sm">إضافة وتعديل المحاضرات وربط امتحانات المتطلبات المسبقة بها</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
            } else {
              handleOpenNewForm();
            }
          }}
          className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-dark transition shadow-md"
        >
          {showForm ? "إلغاء" : <><Plus className="w-5 h-5" /> إضافة محاضرة جديدة</>}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6" dir="rtl">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
              {editingId ? "✏️ تعديل المحاضرة والشروط" : "➕ إضافة محاضرة جديدة"}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-semibold flex items-center gap-2 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">عنوان المحاضرة (Lecture Title) *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: محاضرة التمريض الباطني والجراحي"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">منصة المحاضرة (Platform) *</label>
              <select
                value={formData.platform}
                onChange={e => setFormData({ ...formData, platform: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-bold text-primary-dark"
              >
                <option value="ZOOM">Zoom Meeting</option>
                <option value="FREE_CONFERENCE">Free Conference</option>
                <option value="VIDEO">Video File / Link</option>
              </select>
            </div>

            {/* URL Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                {formData.platform === 'ZOOM' && 'رابط اجتماع زووم (Zoom Meeting URL) *'}
                {formData.platform === 'FREE_CONFERENCE' && 'رابط فري كونفرنس (Free Conference URL) *'}
                {formData.platform === 'VIDEO' && 'رابط الفيديو / البث (Video URL) *'}
              </label>
              <input
                required
                type="url"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                dir="ltr"
                placeholder={
                  formData.platform === 'ZOOM' ? "https://zoom.us/j/123456789" :
                    formData.platform === 'FREE_CONFERENCE' ? "https://join.freeconferencecall.com/room" :
                      "https://..."
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white text-left font-mono text-sm"
              />
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 font-bold">الكورس (Course) *</label>
              <select
                required
                value={formData.courseId}
                onChange={e => handleCourseChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-semibold"
              >
                <option value="" disabled>-- اختر الكورس --</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.category || 'عام'})</option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700 font-bold">القسم (Section) *</label>
                {formData.courseId && sections.length === 0 && !sectionsLoading && (
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg hover:bg-amber-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> إضافة قسم
                  </button>
                )}
              </div>
              <select
                required
                disabled={!formData.courseId || sectionsLoading || sections.length === 0}
                value={formData.sectionId}
                onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-semibold disabled:bg-gray-100 disabled:text-gray-400"
              >
                {!formData.courseId ? (
                  <option value="">اختر الكورس أولاً</option>
                ) : sectionsLoading ? (
                  <option value="">جاري تحميل الأقسام...</option>
                ) : sections.length === 0 ? (
                  <option value="">لا توجد أقسام لهذا الكورس</option>
                ) : (
                  <>
                    <option value="" disabled>-- اختر القسم --</option>
                    {sections.map(sec => (
                      <option key={sec._id} value={sec._id}>{sec.title}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* REQUIREMENT 11 & 14: Prerequisites & Exam Link Setup */}
            <div className="md:col-span-2 bg-[#061B3D]/5 border border-[#061B3D]/15 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-[#061B3D] text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" /> المتطلبات المسبقة والامتحانات المرتبطة بالمحاضرة
              </h4>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">نوع الشرط المسبق (Prerequisite)</label>
                  <select value={formData.prerequisiteType} onChange={e => setFormData({ ...formData, prerequisiteType: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none">
                    <option value="NONE">بدون شرط (متاحة فورا)</option>
                    <option value="LESSON">مشاهدة المحاضرة السابقة</option>
                    <option value="EXAM">اجتياز امتحان المحاضرة السابقة</option>
                  </select>
                </div>

                {formData.prerequisiteType === 'EXAM' && (
                  <div>
                    <label className="block text-xs font-bold mb-1">امتحان المتطلب المسبق المطلوب اجتيازه</label>
                    <select value={formData.prerequisiteExamId} onChange={e => setFormData({ ...formData, prerequisiteExamId: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none">
                      <option value="">اختر الامتحان المسبق</option>
                      {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">الامتحان الخاص بهذه المحاضرة (Attached Exam)</label>
                  <select value={formData.examId} onChange={e => setFormData({ ...formData, examId: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none">
                    <option value="">بدون امتحان ملحق</option>
                    {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">نسبة نجاح الامتحان المطلوب (٪)</label>
                  <input type="number" min="0" max="100" value={formData.passingPercentage} onChange={e => setFormData({ ...formData, passingPercentage: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">وصف المحاضرة (Description)</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="تفاصيل وشرح مختصر للمحاضرة..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white resize-none"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">المدة المتوقعة (Duration)</label>
              <input
                type="text"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                placeholder="مثال: ساعة و 30 دقيقة"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">حالة العرض (Status)</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-primary bg-white font-semibold"
              >
                <option value="published">منشورة (Published)</option>
                <option value="draft">مسودة (Draft)</option>
                <option value="archived">مؤرشفة (Archived)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || sectionsLoading || !formData.sectionId}
              className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? "تحديث المحاضرة" : "حفظ المحاضرة"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3" dir="rtl">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="بحث بالاسم أو الوصف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border outline-none focus:border-primary text-sm bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select value={filterCourse} onChange={e => handleFilterCourseChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none text-xs bg-white font-semibold">
            <option value="">كل الكورسات</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>

        <div>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none text-xs bg-white font-semibold">
            <option value="">كل المنصات</option>
            <option value="ZOOM">Zoom</option>
            <option value="FREE_CONFERENCE">Free Conference</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>

        <div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none text-xs bg-white font-semibold">
            <option value="">كل الحالات</option>
            <option value="published">منشورة</option>
            <option value="draft">مسودة</option>
          </select>
        </div>
      </div>

      {/* Videos List Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
          لا توجد محاضرات مطابقة للبحث.
        </div>
      ) : (
        <div className="overflow-x-auto" dir="rtl">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b">
              <tr>
                <th className="p-3">الكورس</th>
                <th className="p-3">القسم</th>
                <th className="p-3">عنوان المحاضرة</th>
                <th className="p-3">الامتحان المرتبط</th>
                <th className="p-3">المنصة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map(video => (
                <tr key={video._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-3 text-gray-800 font-bold">{video.courseId?.title || "كورس غير معروف"}</td>
                  <td className="p-3 font-semibold text-primary">{video.sectionId?.title || "—"}</td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{video.title}</div>
                    {video.description && <div className="text-xs text-gray-500 line-clamp-1">{video.description}</div>}
                  </td>
                  <td className="p-3">
                    {video.examId ? (
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        <Award className="w-3 h-3" /> {video.examId.title || 'امتحان مرتبط'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${(video.platform || video.videoType?.toUpperCase()) === 'ZOOM' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      (video.platform || video.videoType?.toUpperCase()) === 'FREE_CONFERENCE' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {(video.platform || video.videoType?.toUpperCase()) === 'FREE_CONFERENCE' ? 'Free Conference' : (video.platform || 'ZOOM')}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleStatus(video)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${video.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {video.status === 'published' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {video.status === 'published' ? 'منشورة' : 'مسودة'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="معاينة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(video)}
                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModalVideo(video)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="حذف المحاضرة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl" dir="rtl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">هل أنت متأكد من حذف هذه المحاضرة؟</h3>
            <p className="text-gray-500 text-sm mb-6">"{deleteModalVideo.title}"</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteModalVideo(null)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-md"
              >
                حذف المحاضرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
