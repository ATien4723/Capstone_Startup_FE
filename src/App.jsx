import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import routers from '@/routers/routers'
import CustomToastContainer from '@/components/Common/CustomToastContainer';
import authService from '@/apis/authService';
import { LikeProvider } from '@/contexts/LikeContext.jsx';
import ProtectedRoute from './components/Common/ProtectedRoute';


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
            element={
              item.protected ? (
                <ProtectedRoute>
                  <item.component />
                </ProtectedRoute>
              ) : (
                <item.component />
              )
            }
            key={`standard-${index}`}
          />
        ))}

        {/* Render các route cha với route con lồng nhau */}
        {parentRoutes.map((parentRoute, parentIndex) => (
          <Route
            path={parentRoute.path}
            element={
              parentRoute.protected ? (
                <ProtectedRoute>
                  <parentRoute.component />
                </ProtectedRoute>
              ) : (
                <parentRoute.component />
              )
            }
            key={`parent-${parentIndex}`}
          >
            {childRoutes
              .filter(childRoute => childRoute.parent === parentRoute.path)
              .map((childRoute, childIndex) => (
                <Route
                  path={childRoute.path.replace(`${parentRoute.path}/`, '')}
                  element={
                    childRoute.protected ? (
                      <ProtectedRoute>
                        <childRoute.component />
                      </ProtectedRoute>
                    ) : (
                      <childRoute.component />
                    )
                  }
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
    <LikeProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {renderRoutes()}
          </Routes>
        </Suspense>
        <CustomToastContainer />
      </BrowserRouter>
    </LikeProvider>
  )
}

export default App

