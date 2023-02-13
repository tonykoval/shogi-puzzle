import json
from dataclasses import dataclass
from typing import Optional

from shogi import Move

from node import Node
from score import Score


@dataclass
class EngineMove:
    move: Move
    score: Score


@dataclass
class EngineUsiMove:
    usi: str
    score: Score


@dataclass
class Puzzle:
    id: str
    sfen: str
    opponent_last_move_usi: str
    your_move_usi: str
    player: str
    prev_score: Score
    prev_material: int
    score: Score
    material: int
    best: EngineUsiMove
    second: EngineUsiMove
    third: EngineUsiMove

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__)


@dataclass
class NextMovePair:
    node: Node
    winner: bool #TODO
    best: EngineMove
    second: Optional[EngineMove]
    third: Optional[EngineMove]
