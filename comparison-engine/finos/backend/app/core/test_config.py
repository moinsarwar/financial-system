import os  
  
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")  
if not TEST_DATABASE_URL:  
    raise RuntimeError("TEST_DATABASE_URL must be configured before running tests")  
if "test" not in TEST_DATABASE_URL.lower():  
    raise RuntimeError("Refusing to run tests because TEST_DATABASE_URL does not appear to reference a test database")
