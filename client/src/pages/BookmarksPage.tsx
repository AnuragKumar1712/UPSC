import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface Bookmark {
  question_id: number;
  question_text: string;
  correct_answer: string;
  section_name: string;
  topic_name: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const load = () =>
    api.getBookmarks().then((b) => setBookmarks(b as Bookmark[]));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-upsc-navy">Bookmarks</h2>
      <p className="text-gray-500 mt-1">{bookmarks.length} saved questions</p>

      <Link
        to="/revision?type=bookmarked"
        className="inline-block mt-4 px-4 py-2 bg-upsc-gold text-upsc-navy rounded-lg text-sm font-medium"
      >
        Practice Bookmarked
      </Link>

      <div className="mt-6 space-y-3">
        {bookmarks.map((b) => (
          <div key={b.question_id} className="bg-white border rounded-lg p-4">
            <p className="font-medium whitespace-pre-wrap break-words">
              {b.question_text}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {b.section_name} · {b.topic_name}
            </p>
            <p className="text-sm text-green-700 mt-1 whitespace-pre-wrap break-words">
              Answer: {b.correct_answer}
            </p>
            <button
              onClick={async () => {
                await api.removeBookmark(b.question_id);
                load();
              }}
              className="mt-2 text-sm text-red-600"
            >
              Remove bookmark
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
