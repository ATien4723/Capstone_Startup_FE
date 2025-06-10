import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import routers from '@/routers/routers'
import CustomToastContainer from '@/components/Common/CustomToastContainer';
import authService from '@/apis/authService';

function App() {
  useEffect(() => {
    authService.cleanupStorage();
  }, []);

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
      <CustomToastContainer />
    </BrowserRouter>
  )
}

export default App

