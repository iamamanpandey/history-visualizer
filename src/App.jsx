import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORIES = {
  "Social Media": [
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
  ],
  Video: ["youtube.com", "netflix.com", "twitch.tv"],
  Shopping: ["amazon.com", "ebay.com", "walmart.com"],
  News: ["news.google.com", "reuters.com", "bbc.com", "cnn.com"],
};

const App = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    chrome.history.search(
      {
        text: "",
        startTime: oneWeekAgo,
        maxResults: 10000,
      },
      (historyItems) => {
        setHistory(historyItems);
        analyzeHistory(historyItems);
        setLoading(false);
      }
    );
  };

  const categorizeUrl = (url) => {
    try {
      const hostname = new URL(url).hostname;
      for (const [category, domains] of Object.entries(CATEGORIES)) {
        if (domains.some((domain) => hostname.includes(domain))) {
          return category;
        }
      }
      return "Other";
    } catch {
      return "Invalid URL";
    }
  };

  const analyzeHistory = (historyItems) => {
    const categoryStats = {};
    const dateStats = {};
    const hourlyStats = Array(24).fill(0);

    historyItems.forEach((item) => {
      const category = categorizeUrl(item.url);
      categoryStats[category] = (categoryStats[category] || 0) + 1;

      const date = format(new Date(item.lastVisitTime), "yyyy-MM-dd");
      dateStats[date] = (dateStats[date] || 0) + 1;

      const hour = new Date(item.lastVisitTime).getHours();
      hourlyStats[hour]++;
    });

    setStats({
      categories: categoryStats,
      dateDistribution: dateStats,
      hourlyDistribution: hourlyStats,
      totalVisits: historyItems.length,
    });
  };

  const chartData = Object.entries(stats.categories || {}).map(
    ([name, value]) => ({
      name,
      value,
      percentage: ((value / stats.totalVisits) * 100).toFixed(1),
    })
  );

  const hourlyData = stats.hourlyDistribution?.map((value, index) => ({
    hour: `${index}:00`,
    visits: value,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-600">
          Loading your browsing history...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-white text-2xl font-bold">
              Browsing History Analysis
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "text-white border-b-2 border-white"
                    : "text-blue-200"
                } text-lg font-medium`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`${
                  activeTab === "details"
                    ? "text-white border-b-2 border-white"
                    : "text-blue-200"
                } text-lg font-medium`}
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Category Distribution
              </h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Hourly Activity</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Detailed History</h2>
            <div className="overflow-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Visit Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                        {item.title || "Untitled"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 truncate max-w-xs">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                        {categorizeUrl(item.url)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(
                          new Date(item.lastVisitTime),
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
