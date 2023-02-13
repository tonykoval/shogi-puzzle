from typing import List, Optional, Tuple

from engine import YaneuraOu, Limit
from model import Puzzle, EngineUsiMove, EngineMove
from node import Node
from score import Score, PovScore, Cp
from util import get_next_move_pair, win_chances, material_count


def preprocessing_game(engine: YaneuraOu, game: Node, limit: Limit):
    print("Analyzing game {}...".format(game.get_id()))

    node = game
    engine.usinewgame()

    while not node.is_end():
        node.eval = engine.analyze(node, limit)
        print("%d.  %s  %s" % (node.current_board.move_number, node.move().usi() if node.move() else "    ",
                               str(node.eval[0]["score"].sente())))
        node = node.variation(0)


def analyze_game(engine: YaneuraOu, game: Node, limit: Limit, threshold: float) -> List[Puzzle]:
    prev_score: Score = Cp(20)
    puzs: List[Puzzle] = list()

    node: Node = game
    prev_node: Node = game

    while not node.is_end():
        current_eval = node.eval[0]["score"]

        if not current_eval:
            # print("Skipping game without eval on move {}".format(node.current_board.move_number))
            return puzs

        result, puz = my_analyze_position(engine, node, prev_node, prev_score, current_eval, limit, threshold)

        if isinstance(puz, Puzzle):
            # print("Found puzzle in %s" % game.get_id())
            puzs.append(puz)

        prev_score = -result
        prev_node = node
        node = node.variation(0)

    if len(puzs) > 0:
        print("Found %s from %s" % (len(puzs), game.get_id()))

    return puzs


# def play_move_material_count(node: Node, usi_move: str) -> int:
#     return material_count(node.board().push_usi(usi_move), not node.board().turn)

def get_engine_move(engine_move: Optional[EngineMove], node: Node) -> Optional[EngineUsiMove]:
    # print(engine_move, node)
    if engine_move is not None:
        if engine_move.move is not None:
            if node.move is not None:
                if node.move().usi() != engine_move.move.usi():
                    EngineUsiMove(engine_move.move.usi(), engine_move.score)
                else:
                    return None
            else:
                return None
        else:
            return None
    else:
        return None


def my_analyze_position(engine: YaneuraOu, node: Node, prev_node: Node, prev_score: Score, current_eval: PovScore,
                        limit: Limit, threshold: float) -> Tuple[Score, Optional[Puzzle]]:
    board = node.board()
    winner = board.turn
    score = current_eval.pov(winner)
    player = "sente" if board.turn else "gote"

    if sum(1 for _ in board.legal_moves) < 2:
        return score, None

    if abs(win_chances(score) - win_chances(prev_score)) > threshold and player == node.get_player():
        next_move_pair = get_next_move_pair(engine, prev_node, winner, limit)

        if abs(win_chances(next_move_pair.best.score) - win_chances(score)) > threshold:
            second_move = get_engine_move(next_move_pair.second, node)
            third_move = get_engine_move(next_move_pair.third, node)

            return score, Puzzle(
                id=node.get_id(),
                sfen=prev_node.current_board.sfen(),
                opponent_last_move_usi=prev_node.move().usi(),
                your_move_usi=node.move().usi(),
                player=player,
                prev_score=prev_score,
                score=score,
                best=EngineUsiMove(next_move_pair.best.move.usi(), next_move_pair.best.score),
                second=second_move,
                third=third_move,
                prev_material=material_count(prev_node.board(), prev_node.board().turn),
                material=material_count(node.board(), node.board().turn)
            )
        else:
            return score, None
    else:
        return score, None
