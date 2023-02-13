import argparse
import json
import logging
import sys
from typing import List, Optional

from shogi import Move, Board

from engine import YaneuraOu, Limit
from generator import preprocessing_game, analyze_game
from model import Puzzle
from node import Node

logger = logging.getLogger(__name__)
logging.basicConfig(format='%(asctime)s %(levelname)-4s %(message)s', datefmt='%m/%d %H:%M:%S')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog='main.py',
        description='takes a file and produces shogi puzzles')
    parser.add_argument("--file", "-f", help="input file", required=True, metavar="test.txt", default="test.txt")
    parser.add_argument("--threads", "-t", help="count of cpu threads for engine searches", default="4")
    parser.add_argument("--nodes", help="count of nodes for engine searches", default="10000000")
    parser.add_argument("--skip", help="How many games to skip from the source", default="0")
    parser.add_argument("--engine", help="exe file", default="YaneuraOu.exe")
    parser.add_argument("--threshold", help="threshold (win_score)", default="0.3")
    parser.add_argument("--output", help="output file", default="data/puzzles.json")

    return parser.parse_args()


# expects this format: id;sfen;moves separated by space
def read_game(l: str) -> Optional[Node]:
    splitted = l.split(';')
    sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
    moves = splitted[2].split(' ')
    root = Node(Board(sfen))
    root.id = splitted[0]
    root.player = splitted[1]
    node = root
    for m in moves:
        if not m:
            break
        node = node.add_variation(Move.from_usi(m))
    return root


def main() -> None:
    sys.setrecursionlimit(10000) # else node.deepcopy() sometimes fails?
    args = parse_args()
    logger.setLevel(logging.INFO)
    logger.info("Input file: {}".format(args.file))
    logger.info("Engine: {} threads: {} nodes: {} threshold: {}".format(args.engine, args.threads, args.nodes,
                                                                       args.threshold))
    logger.info("Output file: {}".format(args.output))
    engine = YaneuraOu(args.engine)
    engine.start_engine(args.threads)
    game_limit = Limit(time=10)
    skip = int(args.skip)
    threshold = float(args.threshold)
    logger.info("Skipping first {} games".format(skip))
    games = 0

    try:
        with open(args.file) as m_file:
            puzzles = []
            for line in m_file:
                if games < skip:
                    continue
                game = read_game(line.strip('\n'))
                preprocessing_game(engine, game, game_limit)
                puzz: List[Puzzle] = analyze_game(engine, game, game_limit, threshold)
                for puzzle in puzz:
                    puzzles.append(puzzle)
                games += 1

            puzzles_json = json.dumps(puzzles, default=lambda o: o.__dict__)
            with open(args.output, 'w') as file:
                file.write(puzzles_json)

    except KeyboardInterrupt:
        sys.exit(1)

    engine.quit()


if __name__ == "__main__":
    main()
