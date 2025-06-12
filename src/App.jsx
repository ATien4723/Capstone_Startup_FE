import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import routers from '@/routers/routers'
import CustomToastContainer from '@/components/Common/CustomToastContainer';
import authService from '@/apis/authService';

function App() {
  useEffect(() => {
    authService.cleanupStorage();
  }, []);

  // Tạo cấu trúc route lồng nhau
  const renderRoutes = () => {
    const parentRoutes = routers.filter(route => route.children === true);
    const childRoutes = routers.filter(route => route.parent);
    const standardRoutes = routers.filter(route => !route.children && !route.parent);

    return (
      <>
        {/* Render các route thông thường */}
        {standardRoutes.map((item, index) => (
          <Route
            path={item.path}
            element={<item.component />}
            key={`standard-${index}`}
          />
        ))}

        {/* Render các route cha với route con lồng nhau */}
        {parentRoutes.map((parentRoute, parentIndex) => (
          <Route
            path={parentRoute.path}
            element={<parentRoute.component />}
            key={`parent-${parentIndex}`}
          >
            {childRoutes
              .filter(childRoute => childRoute.parent === parentRoute.path)
              .map((childRoute, childIndex) => (
                <Route
                  path={childRoute.path.replace(`${parentRoute.path}/`, '')}
                  element={<childRoute.component />}
                  key={`child-${parentIndex}-${childIndex}`}
                />
              ))
            }
          </Route>
        ))}
      </>
    );
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {renderRoutes()}
        </Routes>
      </Suspense>
      <CustomToastContainer />
    </BrowserRouter>
  )
}

export default App

