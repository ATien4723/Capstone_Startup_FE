import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import routers from '@/routers/routers'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {
            routers.map((item, index) => {
              return <Route path={item.path}
                element={<item.component />}
                key={index}
              />
            })
          }
        </Routes>
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  )
}

export default App
