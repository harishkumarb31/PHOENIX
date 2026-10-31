from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...workers.telemetry_worker import telemetry_worker

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await telemetry_worker.register_ws(websocket)
    try:
        while True:
            # Keep socket alive and listen for client messages (e.g. heartbeat)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        telemetry_worker.unregister_ws(websocket)
    except Exception:
        telemetry_worker.unregister_ws(websocket)
