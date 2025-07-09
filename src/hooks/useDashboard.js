import { useState, useEffect } from "react";
import { getStartupDartboard } from "@/apis/dashboardService";
import { getStartupIdByAccountId } from "@/apis/startupService";
import { getUserId } from "@/apis/authService";

const useDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startupId, setStartupId] = useState(null);

    // Lấy startupId từ API dựa trên accountId hiện tại
    useEffect(() => {
        const fetchStartupId = async () => {
            try {
                const accountId = await getUserId();
                if (accountId) {
                    const response = await getStartupIdByAccountId(accountId);
                    if (response) {
                        setStartupId(response);
                        console.log('Đã lấy startupId từ API:', response);
                    } else {
                        setError("Không tìm thấy startup cho tài khoản này");
                        console.log('Không tìm thấy startupId cho accountId:', accountId);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy startupId từ API:', error);
                setError("Không thể lấy thông tin startup. Vui lòng thử lại sau.");
            } finally {
                if (!loading) setLoading(false);
            }
        };

        fetchStartupId();
    }, []);

    // Lấy dữ liệu dashboard khi có startupId
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!startupId) return;

            try {
                setLoading(true);
                const response = await getStartupDartboard(startupId);
                setDashboardData(response);
                setLoading(false);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu dashboard:", err);
                setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [startupId]);

    // Tính toán các chỉ số tổng hợp
    const totalClicks = dashboardData?.clickStatsResultDTO?.totalClickCount || 0;
    const totalInteractions = dashboardData?.interactionStatsResultDTO?.totalInteractionCount || 0;
    const totalSubscribers = dashboardData?.subscribeStatsResultDTO?.totalSubcribeCount || 0;
    const totalPosts = (dashboardData?.postStatsResultDTO?.totalPostCount || 0) +
        (dashboardData?.internshipPostStatsResultDTO?.totalInternshipPostCount || 0);

    // Chuẩn bị dữ liệu biểu đồ
    const prepareChartData = () => {
        // Dữ liệu cho biểu đồ click
        const clickChartData = {
            labels: dashboardData?.clickStatsResultDTO?.dailyClickStats?.map(stat =>
                new Date(stat.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) || [],
            datasets: [
                {
                    label: 'Lượt Click',
                    data: dashboardData?.clickStatsResultDTO?.dailyClickStats?.map(stat => stat.clickCount) || [],
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                }
            ]
        };

        // Dữ liệu cho biểu đồ tương tác
        const interactionChartData = {
            labels: dashboardData?.interactionStatsResultDTO?.dailyInteractionStats?.map(stat =>
                new Date(stat.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) || [],
            datasets: [
                {
                    label: 'Lượt Tương Tác',
                    data: dashboardData?.interactionStatsResultDTO?.dailyInteractionStats?.map(stat => stat.interactionCount) || [],
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                    borderRadius: 5,
                    barThickness: 20,
                }
            ]
        };

        // Dữ liệu cho biểu đồ phân phối
        const distributionChartData = {
            labels: ['Clicks', 'Tương tác', 'Người theo dõi'],
            datasets: [
                {
                    data: [totalClicks, totalInteractions, totalSubscribers],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(6, 182, 212)',
                    ],
                    borderWidth: 1,
                }
            ]
        };

        // Chuẩn bị dữ liệu cho biểu đồ kết hợp
        const combinedChartData = {
            labels: dashboardData?.clickStatsResultDTO?.dailyClickStats?.map(stat =>
                new Date(stat.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) || [],
            datasets: [
                {
                    label: 'Lượt Click',
                    data: dashboardData?.clickStatsResultDTO?.dailyClickStats?.map(stat => stat.clickCount) || [],
                    fill: false,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y',
                },
                {
                    label: 'Lượt Tương Tác',
                    data: dashboardData?.interactionStatsResultDTO?.dailyInteractionStats?.map(stat => stat.interactionCount) || [],
                    fill: false,
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    borderColor: 'rgb(34, 197, 94)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(34, 197, 94)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y',
                }
            ]
        };

        return {
            clickChartData,
            interactionChartData,
            distributionChartData,
            combinedChartData
        };
    };

    // Tùy chọn cho biểu đồ
    const chartOptions = {
        line: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Thống Kê Lượt Click Theo Ngày',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        },
        bar: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Thống Kê Tương Tác Theo Ngày',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        },
        pie: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Phân Bố Tương Tác',
                    font: { size: 16 }
                }
            }
        },
        combined: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Thống Kê Lượt Click và Tương Tác',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return `Ngày: ${tooltipItems[0].label}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: 'Số lượng'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ngày'
                    }
                }
            }
        }
    };

    // Kiểm tra xem có dữ liệu không
    const hasClickData = dashboardData?.clickStatsResultDTO?.dailyClickStats?.length > 0;
    const hasInteractionData = dashboardData?.interactionStatsResultDTO?.dailyInteractionStats?.length > 0;
    const hasData = totalClicks > 0 || totalInteractions > 0 || totalSubscribers > 0;

    return {
        loading,
        error,
        dashboardData,
        startupId,
        totalClicks,
        totalInteractions,
        totalSubscribers,
        totalPosts,
        chartData: prepareChartData(),
        chartOptions,
        hasClickData,
        hasInteractionData,
        hasData
    };
};

export default useDashboard; 