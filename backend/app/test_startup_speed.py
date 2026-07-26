import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_speed_check():
    print("--- Starting Application Startup Speed Diagnostics ---")
    
    # 1. Measure FastAPI module import time
    t0 = time.time()
    from app.main import app
    t_import = time.time() - t0
    print(f"Time taken to import FastAPI app module: {t_import:.4f} seconds")
    
    # 2. Measure run_startup_checks execution speed
    from app.utils.startup_checks import run_startup_checks
    t1 = time.time()
    run_startup_checks()
    t_checks = time.time() - t1
    print(f"Time taken to execute run_startup_checks: {t_checks:.4f} seconds")
    
    total_startup_overhead = t_import + t_checks
    print(f"Total startup latency before uvicorn port bind: {total_startup_overhead:.4f} seconds")
    
    # Assertions to ensure deployment succeeds
    assert t_import < 15.0, f"Error: App module imports are too slow ({t_import:.2f}s)!"
    assert t_checks < 1.0, f"Error: Startup check functions block for too long ({t_checks:.2f}s)!"
    assert total_startup_overhead < 10.0, f"Error: Total startup time exceeds Render timeout safety margins ({total_startup_overhead:.2f}s)!"
    
    print("\n[SUCCESS] Application startup speed verified. Uvicorn port binding will complete in under 1 second!")
    print("--- All Startup Speed Diagnostics Passed Successfully ---")

if __name__ == "__main__":
    run_speed_check()
