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
        isFounder,
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
                <p>No startup information found. You may not have joined or created any startup yet.</p>
            </div>
        );
    }

    const { status, statusClass } = getStatusBadge(startup.status);

    return (
        <>
            <div className="container mx-auto py-6 px-4">
                {/* Thông báo quyền hạn */}
                {!isFounder && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
                        <p className="text-sm">
                            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                            Only founders can edit startup profile and pitching documents.
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Startup Information</h1>
                    {isFounder && !isEditing ? (
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                            onClick={() => setIsEditing(true)}
                        >
                            <FontAwesomeIcon icon={faPencilAlt} className="mr-2" />
                            Edit Information
                        </button>
                    ) : isFounder && isEditing ? (
                        <div className="flex space-x-2">
                            <button
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Cancel
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Banner and Logo */}
                    <div className="relative h-64 bg-gradient-to-r from-blue-500 to-indigo-600">
                        {/* Display background image or preview */}
                        {backgroundPreview ? (
                            <img
                                src={backgroundPreview || startup.backgroundURL}
                                alt="Background"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-75"></div>
                        )}

                        {/* Change background button when in edit mode */}
                        {isFounder && isEditing && (
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
                                    Change Cover Image
                                </button>
                            </div>
                        )}

                        {/* Logo area */}
                        <div className="absolute -bottom-20 left-8 border-4 border-white rounded-lg shadow-xl">
                            <div className="relative overflow-hidden w-36 h-36 bg-white rounded-lg">
                                {/* Display logo or preview */}
                                <img
                                    src={logoPreview || startup.logo || "https://via.placeholder.com/150"}
                                    alt={startup.startupName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/150";
                                    }}
                                />

                                {/* Change logo button when in edit mode */}
                                {isFounder && isEditing && (
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
                                            Change Logo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content section */}
                    <div className="pt-24 px-8 pb-8">
                        {/* Header with name and status */}
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
                                            <label htmlFor="startupName" className="block text-sm font-medium text-gray-700">Startup Name</label>
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
                                            <label htmlFor="abbreviationName" className="block text-sm font-medium text-gray-700">Abbreviation Name</label>
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

                        {/* Detailed information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faInfoCircle} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Description</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.description || "No description available"}</p>
                                            ) : (
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter description about your startup"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faEye} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Vision</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.vision || "No vision available"}</p>
                                            ) : (
                                                <textarea
                                                    name="vision"
                                                    value={formData.vision}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter startup vision"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faBullseye} className="mt-1 text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg mb-2">Mission</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{startup.mission || "No mission available"}</p>
                                            ) : (
                                                <textarea
                                                    name="mission"
                                                    value={formData.mission}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter startup mission"
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
                                            <h3 className="font-semibold text-gray-800 text-lg">Stage</h3>
                                            {!isEditing ? (
                                                <p className="text-gray-700 mt-1">Stage {startup.stageId || "N/A"}</p>
                                            ) : (
                                                <div className="mt-1">
                                                    <input
                                                        type="number"
                                                        name="stageId"
                                                        value={formData.stageId}
                                                        onChange={handleInputChange}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Enter stage (1-5)"
                                                        min="1"
                                                        max="5"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faGlobe} className="text-blue-500 w-5 h-5 mt-1" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">Website</h3>
                                            {!isEditing ? (
                                                startup.website ? (
                                                    <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 block">
                                                        {startup.website}
                                                    </a>
                                                ) : (
                                                    <p className="text-gray-600 mt-1">No website available</p>
                                                )
                                            ) : (
                                                <div className="mt-1">
                                                    <input
                                                        type="url"
                                                        name="website"
                                                        value={formData.website}
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
                                                    <p className="text-gray-600 mt-1">No email available</p>
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

                                <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 w-5 h-5" />
                                        <div className="ml-3 flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">Founded Date</h3>
                                            <p className="text-gray-700 mt-1">{formatDate(startup.createAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phần Pitching */}
                        <div className="mt-10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Pitching Documents</h2>
                                {isFounder && !addPitchingMode ? (
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                        onClick={() => setAddPitchingMode(true)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        Add Pitching Document
                                    </button>
                                ) : isFounder && addPitchingMode ? (
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                                        onClick={() => setAddPitchingMode(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                        Cancel
                                    </button>
                                ) : null}
                            </div>

                            {/* Form thêm pitching */}
                            {isFounder && addPitchingMode && (
                                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-4">Add New Pitching Document</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
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
                                                {currentPitchingType === 'PDF' ? 'Upload PDF File' : 'Upload Video File'}
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
                                                    Selected: {pitchingFile.name}
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
                                                Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Danh sách tài liệu pitching */}
                            {loadingPitchings ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PDF Documents */}
                                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                                            <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
                                            PDF Documents
                                        </h4>
                                        {pitchings.filter(p => p.type === 'PDF').length > 0 ? (
                                            <ul className="space-y-3">
                                                {pitchings.filter(p => p.type === 'PDF').map((pitching) => (
                                                    <li key={pitching.pitchingId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faFilePdf} className="mr-3 text-red-500" />
                                                            <div>
                                                                <button
                                                                    onClick={() => handleOpenPdfViewer(pitching.link)}
                                                                    className="text-blue-600 hover:underline font-medium"
                                                                >
                                                                    PDF Document
                                                                </button>
                                                                <p className="text-sm text-gray-500">
                                                                    Uploaded: {formatDate(pitching.createAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {isFounder && (
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
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenPdfViewer(pitching.link)}
                                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            {isFounder && (
                                                                <button
                                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                                    onClick={() => handleDeletePitching(pitching.pitchingId)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">No PDF documents yet</p>
                                        )}
                                    </div>

                                    {/* Video Documents */}
                                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                                            <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-500" />
                                            Video Pitching
                                        </h4>
                                        {pitchings.filter(p => p.type === 'Video').length > 0 ? (
                                            <ul className="space-y-3">
                                                {pitchings.filter(p => p.type === 'Video').map((pitching) => (
                                                    <li key={pitching.pitchingId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faVideo} className="mr-3 text-blue-500" />
                                                            <div>
                                                                <button
                                                                    onClick={() => handleOpenVideoPlayer(pitching.link)}
                                                                    className="text-blue-600 hover:underline font-medium"
                                                                >
                                                                    Video Pitching
                                                                </button>
                                                                <p className="text-sm text-gray-500">
                                                                    Uploaded: {formatDate(pitching.createAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            {isFounder && (
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
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenVideoPlayer(pitching.link)}
                                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            {isFounder && (
                                                                <button
                                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                                    onClick={() => handleDeletePitching(pitching.pitchingId)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">No video pitching yet</p>
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
