"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Video } from "lucide-react";

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function VideosManager() {
  const [videos, setVideos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", youtubeUrl: "", courseId: "" });

  const fetchData = async () => {
    const [vRes, cRes] = await Promise.all([
      fetch("/api/admin/videos"),
      fetch("/api/admin/courses")
    ]);
    const vData = await vRes.json();
    const cData = await cRes.json();
    setVideos(vData);
    setCourses(cData);
    if (cData.length > 0) setFormData(f => ({ ...f, courseId: cData[0]._id }));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = getYoutubeId(formData.youtubeUrl);
    if (!videoId) return alert("رابط اليوتيوب غير صحيح!");

    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchData();
      setFormData({ title: "", youtubeUrl: "", courseId: courses[0]?._id || "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" />
          إدارة الفيديوهات
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-dark">
          {showForm ? "إلغاء" : <><Plus className="w-4 h-4" /> إضافة فيديو</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">ربط بكورس (اختر الكورس)</label>
            <select required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary">
              {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.category})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">عنوان الفيديو (المحاضرة)</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">رابط يوتيوب</label>
            <input required type="url" value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} className="w-full px-4 py-2 rounded-lg border outline-none focus:border-primary text-left" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
          </div>
          
          {formData.youtubeUrl && getYoutubeId(formData.youtubeUrl) && (
            <div className="md:col-span-2 mt-4">
              <p className="text-sm font-bold text-green-600 mb-2">معاينة الفيديو (بدون لوجو يوتيوب):</p>
              <div className="relative pt-[56.25%] rounded-xl overflow-hidden shadow-lg border-4 border-gray-800">
                <iframe
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  src={`https://www.youtube.com/embed/${getYoutubeId(formData.youtubeUrl)}?modestbranding=1&rel=0&showinfo=0&controls=0&disablekb=1&playsinline=1&autoplay=1&mute=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
                {/* Overlay to prevent clicks linking to YouTube */}
                <div className="absolute inset-0 z-10"></div>
              </div>
            </div>
          )}

          <button type="submit" className="md:col-span-2 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition mt-4">
            حفظ الفيديو
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد فيديوهات مضافة.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {videos.map((video) => {
            const vid = getYoutubeId(video.youtubeUrl);
            return (
              <div key={video._id} className="border p-4 rounded-xl shadow-sm bg-white overflow-hidden">
                <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black mb-4">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${vid}?modestbranding=1&rel=0&showinfo=0&controls=1`}
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-primary-dark">{video.title}</h3>
                    <p className="text-sm text-primary font-semibold mb-2">تابع لكورس: {video.courseId?.title || "كورس محذوف"}</p>
                  </div>
                  <button onClick={() => handleDelete(video._id)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
