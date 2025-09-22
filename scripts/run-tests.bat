@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FINSIGHT AI - TEST RUNNER
echo ========================================
echo.
echo Running all tests for FinSight AI...
echo.

:: Create test results directory
if not exist "test-results" mkdir test-results

echo 🧪 Running backend tests...
cd backend
call mvn test
set backend_result=%errorLevel%
if %backend_result% neq 0 (
    echo ❌ Backend tests failed
) else (
    echo ✅ Backend tests passed
)

:: Copy test results
if exist "target\surefire-reports" (
    xcopy "target\surefire-reports\*" "..\test-results\backend\" /E /I /Y >nul 2>&1
)
cd ..

echo.
echo 🧪 Running frontend tests...
cd frontend
call npm test -- --coverage --watchAll=false
set frontend_result=%errorLevel%
if %frontend_result% neq 0 (
    echo ❌ Frontend tests failed
) else (
    echo ✅ Frontend tests passed
)

:: Copy test results
if exist "coverage" (
    xcopy "coverage\*" "..\test-results\frontend\" /E /I /Y >nul 2>&1
)
cd ..

echo.
echo 📊 TEST RESULTS SUMMARY:
echo.

if %backend_result% equ 0 (
    echo ✅ Backend Tests: PASSED
) else (
    echo ❌ Backend Tests: FAILED
)

if %frontend_result% equ 0 (
    echo ✅ Frontend Tests: PASSED
) else (
    echo ❌ Frontend Tests: FAILED
)

echo.
echo 📁 Test reports saved to: test-results\
echo.

if %backend_result% neq 0 (
    echo 🔍 Backend test details: test-results\backend\
)

if %frontend_result% neq 0 (
    echo 🔍 Frontend test details: test-results\frontend\
)

echo.
if %backend_result% equ 0 if %frontend_result% equ 0 (
    echo ✅ ALL TESTS PASSED!
    echo Your application is ready for deployment.
) else (
    echo ❌ SOME TESTS FAILED!
    echo Please fix failing tests before deployment.
)

echo.
pause
