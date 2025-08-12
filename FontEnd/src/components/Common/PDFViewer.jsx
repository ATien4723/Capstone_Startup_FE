import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes, faDownload } from '@fortawesome/free-solid-svg-icons';

// Cấu hình worker cho PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ pdfUrl, onClose }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function changePage(offset) {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        View PDF Document
                    </h2>
                    <div className="flex items-center space-x-4">
                        <a
                            href={pdfUrl}
                            download
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                            title="Download"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                        </a>
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            title="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="flex flex-col items-center">
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    <p className="mt-4 text-gray-600">Loading document...</p>
                                </div>
                            }
                            error={
                                <div className="text-center text-red-600 p-4">
                                    <p className="font-medium">Unable to load PDF document</p>
                                    <p className="mt-2">Please try again later or download to view</p>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="border border-gray-300 shadow-md"
                                width={550}
                            />
                        </Document>
                    </div>
                </div>

                {/* Controls */}
                <div className="border-t p-4 flex justify-between items-center bg-gray-50">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={previousPage}
                        className={`px-4 py-2 rounded-lg flex items-center ${pageNumber <= 1 ? 'text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
                        Previous Page
                    </button>
                    <p className="text-gray-700">
                        Page <span className="font-semibold">{pageNumber}</span> / {numPages || '--'}
                    </p>
                    <button
                        disabled={pageNumber >= numPages}
                        onClick={nextPage}
                        className={`px-4 py-2 rounded-lg flex items-center ${pageNumber >= numPages ? 'text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                        Next Page
                        <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PDFViewer; 
