import sys
import os
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.scenario_generator import ScenarioEngine, is_503_error
from schemas import Agent, ScenarioGenerationRequest

print("Starting Scenario Generator QA Tests...\n")

def run_test(name, fn):
    try:
        fn()
        print(f"[PASS] {name}")
    except AssertionError as e:
        print(f"[FAIL] {name} FAILED: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"[FAIL] {name} FAILED with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

from datetime import datetime

# Dummy inputs
agent = Agent(
    id=1, 
    name="Test Agent", 
    description="A test agent", 
    system_prompt="Test prompt", 
    policies=[], 
    tools=[], 
    created_at=datetime.utcnow()
)
config = ScenarioGenerationRequest(count=2, categories=["NORMAL_BEHAVIOR"])

def test_is_503_error():
    # Test is_503_error with different exceptions
    # 1. Custom exception with code attribute
    e1 = Exception("Some message")
    e1.code = 503
    assert is_503_error(e1) is True

    # 2. Exception containing "503 UNAVAILABLE" in message
    e2 = Exception("503 UNAVAILABLE - This model is currently experiencing high demand.")
    assert is_503_error(e2) is True

    # 3. Exception containing "Service Unavailable"
    e3 = Exception("Resource has been exhausted (e.g. API rate limit). status: UNAVAILABLE")
    assert is_503_error(e3) is True

    # 4. Standard non-503 exception
    e4 = Exception("400 Bad Request")
    assert is_503_error(e4) is False

def test_successful_generation_on_first_try():
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}), patch("core.scenario_generator.HAS_GENAI", True):
        engine = ScenarioEngine()
        with patch.object(engine, 'client') as mock_client:
            mock_resp = MagicMock()
            mock_resp.text = '[{"test_id": "test-123", "category": "NORMAL_BEHAVIOR", "severity": "INFO", "user_input": "hello", "expected_behavior": "hi", "forbidden_behavior": "bye", "evaluation_criteria": "none"}]'
            mock_client.models.generate_content.return_value = mock_resp

            scenarios = engine.generate_suite(agent, config)
            assert len(scenarios) == 1
            assert scenarios[0].category == "NORMAL_BEHAVIOR"
            assert mock_client.models.generate_content.call_count == 1

def test_retry_on_503_then_success():
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}), patch("core.scenario_generator.HAS_GENAI", True), patch("time.sleep") as mock_sleep:
        engine = ScenarioEngine()
        with patch.object(engine, 'client') as mock_client:
            # First attempt fails with 503, second succeeds
            mock_err = Exception("503 UNAVAILABLE")
            mock_resp = MagicMock()
            mock_resp.text = '[{"test_id": "test-123", "category": "NORMAL_BEHAVIOR", "severity": "INFO", "user_input": "hello", "expected_behavior": "hi", "forbidden_behavior": "bye", "evaluation_criteria": "none"}]'
            
            mock_client.models.generate_content.side_effect = [mock_err, mock_resp]

            scenarios = engine.generate_suite(agent, config)
            assert len(scenarios) == 1
            assert mock_client.models.generate_content.call_count == 2
            mock_sleep.assert_called_once_with(1) # first backoff is 2^0 = 1s

def test_retry_exhausted_fallback_success():
    # Primary model gemini-3.7-flash always returns 503.
    # Fallback model gemini-2.5-flash succeeds.
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key", "LLM_MODEL": "gemini-3.7-flash", "GEMINI_FALLBACK_MODEL": "gemini-2.5-flash"}), patch("core.scenario_generator.HAS_GENAI", True), patch("time.sleep") as mock_sleep:
        engine = ScenarioEngine()
        with patch.object(engine, 'client') as mock_client:
            mock_err = Exception("503 UNAVAILABLE")
            mock_resp = MagicMock()
            mock_resp.text = '[{"test_id": "test-123", "category": "NORMAL_BEHAVIOR", "severity": "INFO", "user_input": "hello", "expected_behavior": "hi", "forbidden_behavior": "bye", "evaluation_criteria": "none"}]'
            
            # 4 failures for gemini-3.7-flash, then 1 success for gemini-2.5-flash
            mock_client.models.generate_content.side_effect = [mock_err, mock_err, mock_err, mock_err, mock_resp]

            scenarios = engine.generate_suite(agent, config)
            assert len(scenarios) == 1
            assert mock_client.models.generate_content.call_count == 5
            # Sleep should be called 3 times (for the primary model's 3 retries: 1s, 2s, 4s)
            assert mock_sleep.call_count == 3

def test_all_models_fail():
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key", "LLM_MODEL": "gemini-3.7-flash", "GEMINI_FALLBACK_MODEL": "gemini-2.5-flash"}), patch("core.scenario_generator.HAS_GENAI", True), patch("time.sleep") as mock_sleep:
        engine = ScenarioEngine()
        with patch.object(engine, 'client') as mock_client:
            mock_err = Exception("503 UNAVAILABLE")
            # Always fail
            mock_client.models.generate_content.side_effect = mock_err

            try:
                engine.generate_suite(agent, config)
                assert False, "Should have raised exception"
            except Exception as ex:
                assert "Gemini API is currently unavailable (503)" in str(ex)
            
            assert mock_client.models.generate_content.call_count == 8 # 4 for primary, 4 for fallback
            assert mock_sleep.call_count == 6 # 3 for primary, 3 for fallback

run_test("is_503_error helper", test_is_503_error)
run_test("Successful generation first try", test_successful_generation_on_first_try)
run_test("Retry on 503 then success", test_retry_on_503_then_success)
run_test("Retry exhausted on primary model, fallback succeeds", test_retry_exhausted_fallback_success)
run_test("All models fail with 503", test_all_models_fail)

print("\nAll Scenario Generator QA Tests Passed!")
