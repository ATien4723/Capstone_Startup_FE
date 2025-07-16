// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import {
//     faBriefcase, faLocationDot, faClock, faCalendarAlt, faMoneyBillWave,
//     faBuilding, faGraduationCap, faLanguage, faCheckCircle, faUserPlus,
//     faBookmark, faShareAlt, faArrowLeft, faSpinner, faClock as faClockSolid, faInfoCircle,
//     faStar, faUserTie, faChevronRight, faFileUpload, faTimes
// } from '@fortawesome/free-solid-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// const nhap = () => {
//     const [showModal, setShowModal] = useState(false);

//     const handelInputBt = () => {
//         setShowModal(true);
//     };
//     const handleCloseModal = () => {
//         setShowModal(false);
//     };

//     return (
//         <div className='bg-blue-500'>
//             <div className="flex items-center justify-center min-h-screen">
//                 <button className="bg-blue-300 bg-gradient-to-r hover:from-red-600 px-5 py-5 
//             rounded-lg transition-all duration-200 transform hover:translate-x-5" onClick={handelInputBt}>
//                     kkkk
//                 </button>
//             </div>
//             {showModal && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-75
//                  bg-gray-400 px-4 pt-4" onClick={handleCloseModal}>
//                     <div className="relative rounded-lg shadow-xl w-full max-w-lg sm:my-8 sm:w-full">
//                         <div className="bg-white px-4 pt-4 ">
//                             <div className='sm:flex sm:items-start'>
//                                 <div className='flex items-center justify-center h-12 w-12 flex-shrink-0'>
//                                     <FontAwesomeIcon icon={faFileUpload} className='text-green-500 h-6 w-6' />
//                                 </div>
//                                 <div className='text-center w-full'>
//                                     <h3 className='text-lg text-center'>ung tuyen cv</h3>
//                                     <div>
//                                         <form>
//                                             <div className='mt-4'>
//                                                 <label className='block'>tai len cv cua b</label>
//                                                 <div className='flex justify-center border-2 px-6 pt-6 pb-6 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors'>
//                                                     <div className="space-y-1 text-center">
//                                                         <div className='flex flex-col text-sm'>
//                                                             <label
//                                                                 htmlFor="file-upload"
//                                                                 className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
//                                                             >
//                                                                 <span>tai cv len</span>
//                                                                 <input
//                                                                     id="file-upload"
//                                                                     name="file-upload"
//                                                                     type="file"
//                                                                     className="sr-only"
//                                                                 />
//                                                             </label>
//                                                             <p className='pl-1'>keo tha tai day</p>
//                                                         </div>
//                                                         <p className="text-xs text-gray-500">
//                                                             PDF, DOC, DOCX tối đa 10MB
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </form>
//                                     </div>
//                                 </div>

//                             </div>

//                         </div>
//                         <div className='bg-gray-50 px-4 py-4'>

//                         </div>
//                     </div>
//                 </div>
//             )
//             }
//         </div>

//     );

// };
// export default nhap;