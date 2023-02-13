package shogi.puzzler

import shogi.format.Reader.Result.{Complete, Incomplete}

import io.circe.generic.auto._
import io.circe.syntax._
import shogi.format.forsyth.Sfen
import shogi.format.kif.KifParser
import shogi.format.usi.Usi
import shogi.format.{ParsedNotation, Reader, Tag}
import shogi.{Color, Game, Replay}

import java.io.PrintWriter
import scala.io.Source

object LishogiParser extends App {
  val parser = KifParser.full _

  val positions: Seq[Position] = (for (kifFilename <- getListOfFiles("kif")) yield {
    parser(Source.fromFile(kifFilename).mkString) map { parsedNotation: ParsedNotation =>

      val listSfen: Seq[(Vector[Usi], Sfen)] =
        (Reader.fromParsedNotation(parsedNotation, x => x) match {
          case Complete(replay) =>
            Replay.gamesWhileValid(replay.state.usiMoves, None, shogi.variant.Standard)._1.map(x => (x.usiMoves, x.toSfen))
          case Incomplete(_, failures) => throw new Exception(failures)
        }).toList

      val sente = parsedNotation.tags.value.find(_.name == Tag.Sente).map(_.value)
      val gote = parsedNotation.tags.value.find(_.name == Tag.Gote).map(_.value)
      val timeControl = parsedNotation.tags.value.find(_.name == Tag.TimeControl).map(_.value)
      val site = parsedNotation.tags.value.find(_.name == Tag.Site).map(_.value)
      val date = parsedNotation.tags.value.find(_.name == Tag.Start).map(_.value)

      val player: Color = findMe(sente, gote).getOrElse(throw new Exception("player not found"))

      (for ((move, index) <- parsedNotation.parsedMoves.value.zipWithIndex) yield {
        val game = Game(Some(shogi.variant.Standard), Some(listSfen(index)._2))
        val judgement = getJudgement(move.metas.comments.mkString(" "))

        if (judgement.nonEmpty
          && (player == game.color)
        ) {
          val sfen = Game(Some(shogi.variant.Standard), Some(listSfen(index)._2)).toSfen.toString
          val yourMove = listSfen(index + 1)._1.last
          splitComment(move.metas.comments.head) match {
            case Some(commentMove) =>
              List(Position(
                id = kifFilename.replaceAll("kif\\\\", "") + "#" + index,
                sfen = sfen,
                hands = sfen.split(" ")(2),
                comment = move.metas.comments.head,
                judgement = judgement.get.name,
                timeControl = timeControl.getOrElse(""),
                date = date.getOrElse(""),
                site = site.getOrElse(""),
                kifName = kifFilename,
                player = player.name,
                opponentLastMoveUsi = listSfen(index)._1.last.usi,
                opponentLastMovePosition = listSfen(index)._1.last.positions.map(_.key),
                yourMoveUsi = yourMove.usi,
                yourMove = getPiece(yourMove.usi, player, None, None).getOrElse(throw new Exception("error")),
                engineMoveUsi = commentMove.usiMove,
                engineMove = getPiece(commentMove.usiMove, player, Some(1), None).getOrElse(throw new Exception("error"))
              ))

            case None => throw new Exception(s"cannot parse comment: ${move.metas.comments.head}")
          }
        } else List()
      }).flatten
    } getOrElse List()
  }).flatten

  new PrintWriter("docs/data/positions.json") {
    write(positions.asJson.spaces2)
    close()
  }

  println(s"number of games: ${getListOfFiles("kif").size}")
  println(s"number of blunders: ${positions.count(_.judgement == Judgement.Blunder.name)}")
  println(s"number of mistakes ${positions.count(_.judgement == Judgement.Mistake.name)}")
  println(s"number of inaccuracies: ${positions.count(_.judgement == Judgement.Inaccuracy.name)}")
}
