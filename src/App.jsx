import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import routers from '@/routers/routers'
import CustomToastContainer from '@/components/Common/CustomToastContainer';
import { LikeProvider } from '@/contexts/LikeContext.jsx';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  // Không cần gọi authService.cleanupStorage() vì đã được xử lý trong AuthContext

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
                <ProtectedRoute requireStartup={item.requireStartup} preventIfMember={item.preventIfMember}>
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
                <ProtectedRoute requireStartup={parentRoute.requireStartup} preventIfMember={parentRoute.preventIfMember}>
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
                      <ProtectedRoute requireStartup={childRoute.requireStartup} preventIfMember={childRoute.preventIfMember}>
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
    <AuthProvider>
      <LikeProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }>
            <Routes>
              {renderRoutes()}
            </Routes>
          </Suspense>
          <CustomToastContainer />
        </BrowserRouter>
      </LikeProvider>
    </AuthProvider>
  )
}

export default App

