import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding,
    faGlobe,
    faEnvelope,
    faInfoCircle,
    faEye,
    faBullseye,
    faCalendarAlt,
    faCheck,
    faSeedling,
    faPencilAlt,
    faSave,
    faTimes,
    faImage,
    faUpload,
    faFilePdf,
    faVideo,
    faTrash,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import useStartupInfo from '@/hooks/useStartupInfo';
import PDFViewer from '@/components/Common/PDFViewer';
import VideoPlayer from '@/components/Common/VideoPlayer';

const StartupInfo = () => {
    const {
        startup,
        loading,
        error,
        isEditing,
        formData,
        logoInputRef,
        backgroundInputRef,
        logoPreview,
        backgroundPreview,
        saving,
        formatDate,
        handleInputChange,
        handleLogoChange,
        handleBackgroundChange,
        handleSave,
        handleCancel,
        getStatusBadge,
        setIsEditing,
        pitchings,
        loadingPitchings,
        addPitchingMode,
        setAddPitchingMode,
        currentPitchingType,
        setCurrentPitchingType,
        pitchingFile,
        setPitchingFile,
        handlePitchingFileChange,
        handleCreatePitching,
        handleDeletePitching,
        handleUpdatePitching,
        // PDF viewer props
        selectedPdf,
        isPdfViewerOpen,
        handleOpenPdfViewer,
        handleClosePdfViewer,
        // Video player props
        selectedVideo,
        isVideoPlayerOpen,
        handleOpenVideoPlayer,
        handleCloseVideoPlayer
    } = useStartupInfo();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    if (!startup) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <p>Không có thông tin startup nào được tìm thấy. Có thể bạn chưa tham gia hoặc tạo startup nào.</p>
            </div>
        );
    }

    const { status, statusClass } = getStatusBadge(startup.status);

    return (
        <>
            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Thông tin Startup</h1>
                    {!isEditing ? (
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                            onClick={() => setIsEditing(true)}
                        >
                            <FontAwesomeIcon icon={faPencilAlt} className="mr-2" />
                            Chỉnh sửa thông tin
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Hủy
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Card chính */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Banner và Logo */}
                    <div className="relative h-64 bg-gradient-to-r from-blue-500 to-indigo-600">
                        {/* Hiển thị background image hoặc preview */}
                        {backgroundPreview ? (
                            <img
                                src={backgroundPreview || startup.backgroundURL}
                                alt="Background"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-75"></div>
                        )}

                        {/* Nút thay đổi background khi đang ở chế độ edit */}
                        {isEditing && (
                            <div className="absolute top-4 right-4">
                                <input
                                    type="file"
                                    ref={backgroundInputRef}
                                    onChange={handleBackgroundChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => backgroundInputRef.current.click()}
                                    className="bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
                                >
                                    <FontAwesomeIcon icon={faImage} className="mr-2" />
                                    Thay đổi ảnh bìa
                                </button>
                            </div>
                        )}

                        {/* Logo area */}
                        <div className="absolute -bottom-20 left-8 border-4 border-white rounded-lg shadow-xl">
                            <div className="relative overflow-hidden w-36 h-36 bg-white rounded-lg">
                                {/* Hiển thị logo hoặc preview */}
                                <img
                                    src={logoPreview || startup.logo || "https://via.placeholder.com/150"}
                                    alt={startup.startupName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/150";
                                    }}
                                />

                                {/* Nút thay đổi logo khi ở chế độ edit */}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                                        <input
                                            type="file"
                                            ref={logoInputRef}
                                            onChange={handleLogoChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => logoInputRef.current.click()}
                                            className="bg-white/90 hover:bg-white text-gray-800 px-3 py-2 rounded-lg flex items-center text-sm"
                                        >
                                            <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                            Thay logo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phần nội dung */}
                    <div className="pt-24 px-8 pb-8">
                        {/* Header với tên và trạng thái */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                {!isEditing ? (
                                    <>
                                        <h2 className="text-3xl font-bold text-gray-800">{startup.startupName}</h2>
                                        {startup.abbreviationName && (
                                            <p className="text-gray-600 text-lg">{startup.abbreviationName}</p>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="startupName" className="block text-sm font-medium text-gray-700">Tên Startup</label>
                                            <input
                                                type="text"
                                                id="startupName"
                                                name="startupName"
                                                value={formData.startupName}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="abbreviationName" className="block text-sm font-medium text-gray-700">Tên viết tắt</label>
                                            <input
                                                type="text"
                                                id="abbreviationName"
                                                name="abbreviationName"
                                                value={formData.abbreviationName}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded-full text-sm ${statusClass}`}>
                                    {status === 'verified' && <FontAwesomeIcon icon={faCheck} className="mr-1" />}
                                    {status || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faInfoCircle} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Mô tả</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.description || "Chưa có mô tả"}</p>
                                            ) : (
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Nhập mô tả về startup của bạn"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faEye} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Tầm nhìn</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.vision || "Chưa có tầm nhìn"}</p>
                                            ) : (
                                                <textarea
                                                    name="vision"
                                                    value={formData.vision}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Nhập tầm nhìn của startup"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faBullseye} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Sứ mệnh</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.mission || "Chưa có sứ mệnh"}</p>
                                            ) : (
                                                <textarea
                                                    name="mission"
                                                    value={formData.mission}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Nhập sứ mệnh của startup"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faSeedling} className="text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">Giai đoạn</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 mt-1">Giai đoạn {startup.stageId || "N/A"}</p>
                                            ) : (
                                                <div className="mt-1">
                                                    <input
                                                        type="number"
                                                        name="stageId"
                                                        value={formData.stageId}
                                                        onChange={handleInputChange}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Nhập giai đoạn (1-5)"
                                                        min="1"
                                                        max="5"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 w-5 h-5" />
                                        <div className="ml-3">
                                            <h3 className="font-semibold text-gray-800 text-lg">Ngày thành lập</h3>
                                            <p className="text-gray-700 mt-1">{formatDate(startup.createAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faGlobe} className="text-blue-500 w-5 h-5 mt-1" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">Website</h3>
                                            {!isEditing ? (
                                                startup.websiteURL ? (
                                                    <a href={startup.websiteURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">
                                                        {startup.websiteURL}
                                                    </a>
                                                ) : (
                                                    <p className="text-gray-600 mt-1">Chưa có website</p>
                                                )
                                            ) : (
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        name="websiteURL"
                                                        value={formData.websiteURL}
                                                        onChange={handleInputChange}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="https://example.com"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 w-5 h-5 mt-1" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">Email</h3>
                                            {!isEditing ? (
                                                startup.email ? (
                                                    <a href={`mailto:${startup.email}`} className="text-blue-600 hover:underline mt-1 block">
                                                        {startup.email}
                                                    </a>
                                                ) : (
                                                    <p className="text-gray-600 mt-1">Chưa có email</p>
                                                )
                                            ) : (
                                                <div className="mt-1">
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="contact@example.com"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phần Pitching */}
                        <div className="mt-10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Tài liệu Pitching</h2>
                                {!addPitchingMode ? (
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                        onClick={() => setAddPitchingMode(true)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        Thêm tài liệu Pitching
                                    </button>
                                ) : (
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                        onClick={() => setAddPitchingMode(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                        Hủy
                                    </button>
                                )}
                            </div>

                            {/* Form thêm pitching */}
                            {addPitchingMode && (
                                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-4">Thêm tài liệu Pitching mới</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài liệu</label>
                                            <div className="flex space-x-4">
                                                <button
                                                    className={`px-4 py-2 rounded-lg flex items-center ${currentPitchingType === 'PDF' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'}`}
                                                    onClick={() => setCurrentPitchingType('PDF')}
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                                                    PDF
                                                </button>
                                                <button
                                                    className={`px-4 py-2 rounded-lg flex items-center ${currentPitchingType === 'Video' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'}`}
                                                    onClick={() => setCurrentPitchingType('Video')}
                                                >
                                                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                                                    Video
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {currentPitchingType === 'PDF' ? 'Tải lên file PDF' : 'Tải lên file Video'}
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="file"
                                                    onChange={handlePitchingFileChange}
                                                    accept={currentPitchingType === 'PDF' ? ".pdf" : "video/*"}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>
                                            {pitchingFile && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Đã chọn: {pitchingFile.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                                onClick={handleCreatePitching}
                                                disabled={!pitchingFile}
                                            >
                                                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                                Tải lên
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hiển thị danh sách pitching */}
                            {loadingPitchings ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="text-gray-600 mt-2">Đang tải tài liệu...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PDF Pitchings */}
                                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                                        <div className="flex items-center mb-4">
                                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-xl mr-2" />
                                            <h3 className="text-lg font-semibold">Tài liệu PDF</h3>
                                        </div>

                                        {pitchings.filter(p => p.type === 'PDF').length > 0 ? (
                                            <ul className="space-y-3">
                                                {pitchings.filter(p => p.type === 'PDF').map((pitching, index) => (
                                                    <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mr-2" />
                                                                <span className="text-gray-800">Tài liệu {index + 1}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Đăng tải: {formatDate(pitching.createAt)}
                                                            </p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleOpenPdfViewer(pitching.link)}
                                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <label className="cursor-pointer text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                                                <FontAwesomeIcon icon={faPencilAlt} />
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept={pitching.type === 'PDF' ? ".pdf" : "video/*"}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            handleUpdatePitching(pitching.pitchingId, file);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            <button
                                                                className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                                onClick={() => handleDeletePitching(pitching.pitchingId)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">Chưa có tài liệu PDF nào</p>
                                        )}
                                    </div>

                                    {/* Video Pitchings */}
                                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                                        <div className="flex items-center mb-4">
                                            <FontAwesomeIcon icon={faVideo} className="text-blue-500 text-xl mr-2" />
                                            <h3 className="text-lg font-semibold">Video Pitching</h3>
                                        </div>

                                        {pitchings.filter(p => p.type === 'Video').length > 0 ? (
                                            <ul className="space-y-3">
                                                {pitchings.filter(p => p.type === 'Video').map((pitching, index) => (
                                                    <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <FontAwesomeIcon icon={faVideo} className="text-blue-500 mr-2" />
                                                                <span className="text-gray-800">Video {index + 1}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Đăng tải: {formatDate(pitching.createAt)}
                                                            </p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleOpenVideoPlayer(pitching.link)}
                                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <label className="cursor-pointer text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                                                <FontAwesomeIcon icon={faPencilAlt} />
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept={pitching.type === 'PDF' ? ".pdf" : "video/*"}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            handleUpdatePitching(pitching.pitchingId, file);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            <button
                                                                className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                                onClick={() => handleDeletePitching(pitching.pitchingId)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">Chưa có video pitching nào</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Viewer */}
            {isPdfViewerOpen && selectedPdf && (
                <PDFViewer pdfUrl={selectedPdf} onClose={handleClosePdfViewer} />
            )}

            {/* Video Player */}
            {isVideoPlayerOpen && selectedVideo && (
                <VideoPlayer videoUrl={selectedVideo} onClose={handleCloseVideoPlayer} />
            )}
        </>
    );
};

export default StartupInfo; 