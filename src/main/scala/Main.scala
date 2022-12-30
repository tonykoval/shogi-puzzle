import io.circe.generic.auto._
import io.circe.syntax._
import shogi.format.Reader.Result.{Complete, Incomplete}
import shogi.format.forsyth.Sfen
import shogi.format.kif.KifParser
import shogi.format.usi.Usi
import shogi.format.{ParsedNotation, Reader, Tag}
import shogi.{Color, Game, Replay}

import java.io.{File, PrintWriter}
import scala.io.Source

object Main extends App {
  val parser = KifParser.full _

  def getListOfFiles(dir: String): List[String] = {
    val file = new File(dir)
    file.listFiles.filter(_.isFile)
      .filter(_.getName.startsWith("lishogi_"))
      .map(_.getPath).toList
  }

  def getListOfFiles(dir: File): List[File] = dir.listFiles.filter(_.isFile).toList

  case class CommentMove(score1: Double, score2: Double, usiMove: String)

  def splitComment(comment: String): Option[CommentMove] = {
    val roundBracketSplitter = "(?<=\\().+?(?=\\))".r
    val squareBracketSplitter = "(?<=\\[).+?(?=\\])".r

    val scores = roundBracketSplitter findFirstIn comment match {
      case Some(scores) => scores.split("→").toList
      case _ => return None
    }

    val usiMove = squareBracketSplitter findFirstIn comment match {
      case Some(usiMove) => usiMove.split("\\.")(1)
      case _ => return None
    }

    Some(CommentMove(scores.head.toDouble, scores(1).toDouble, usiMove))
  }

  case class Drop(role: String, pos: String)

  case class HintOrig(role: String, color: String)

  case class HintDropWrap(orig: HintOrig, dest: String, brush: String = "alternative0")

  case class WrapDrop(drop: Drop, hint: HintDropWrap)

  case class Move(orig: String, dest: String, promotion: Boolean)

  case class HintMoveWrap(orig: String, dest: String, brush: String = "alternative0")

  case class WrapMove(move: Move, hint: HintMoveWrap)

  case class WrapPiece(drop: Option[WrapDrop] = None, move: Option[WrapMove] = None)

  def getPiece(usiMove: String, color: Color, isEngineMove: Boolean): Option[WrapPiece] = {
    (for {
      usi <- Usi.apply(usiMove)
    } yield {
      if (usi.positions.size == 1) {
        val drop: Usi.Drop = Usi.Drop(usiMove).get
        Some(
          WrapPiece(
            drop = Some(
              WrapDrop(
                Drop(
                  drop.role.name,
                  drop.pos.key),
                HintDropWrap(
                  HintOrig(
                    drop.role.name,
                    color.name),
                  drop.pos.key,
                  if (isEngineMove) "primary" else "alternative0"
                )
              )
            )
          )
        )
      } else {
        val move = Usi.Move(usiMove).get
        Some(
          WrapPiece(
            move = Some(
              WrapMove(
                Move(
                  move.orig.key,
                  move.dest.key,
                  move.promotion
                ),
                HintMoveWrap(
                  move.orig.key,
                  move.dest.key,
                  if (isEngineMove) "primary" else "alternative0"
                )
              )
            )
          )
        )
      }
    }).flatten
  }

  def findMe(
              senteOpt: Option[String],
              goteOpt: Option[String],
              player: String = "tonyko"): Option[Color] = {
    (for {
      sente <- senteOpt
      gote <- goteOpt
    } yield {
      if (sente.toLowerCase.contains(player)) Some(Color.sente)
      else if (gote.toLowerCase.contains(player)) Some(Color.gote)
      else None
    }).flatten
  }

  case class Blunder(
                      id: String,
                      sfen: String,
                      hands: String,
                      comment: String,
                      timeControl: String,
                      date: String,
                      site: String,
                      kifName: String,
                      player: String,
                      opponentLastMoveUsi: String,
                      opponentLastMovePosition: List[String],
                      yourMoveUsi: String,
                      yourMove: WrapPiece,
                      engineMoveUsi: String,
                      engineMove: WrapPiece
                    )

  val blunders = (for (kifFilename <- getListOfFiles("kif")) yield {
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

        if (move.metas.comments.mkString(" ").contains("Blunder")
          && (player == game.color)
        ) {
          val sfen = Game(Some(shogi.variant.Standard), Some(listSfen(index)._2)).toSfen.toString
          val yourMove = listSfen(index + 1)._1.last
          splitComment(move.metas.comments.head) match {
            case Some(commentMove) =>
              List(Blunder(
                id = kifFilename.replaceAll("kif\\\\","") + "#" + index,
                sfen = sfen,
                hands = sfen.split(" ")(2),
                comment = move.metas.comments.head,
                timeControl = timeControl.getOrElse(""),
                date = date.getOrElse(""),
                site = site.getOrElse(""),
                kifName = kifFilename,
                player = player.name,
                opponentLastMoveUsi = listSfen(index)._1.last.usi,
                opponentLastMovePosition = listSfen(index)._1.last.positions.map(_.key),
                yourMoveUsi = yourMove.usi,
                yourMove = getPiece(yourMove.usi, player, isEngineMove = false).getOrElse(throw new Exception("error")),
                engineMoveUsi = commentMove.usiMove,
                engineMove = getPiece(commentMove.usiMove, player, isEngineMove = true).getOrElse(throw new Exception("error"))
              ))

            case None => throw new Exception(s"cannot parse comment: ${move.metas.comments.head}")
          }
        } else List()
      }).flatten
    } getOrElse List()
  }).flatten

  new PrintWriter("docs/data/blunders.json") {
    write(blunders.asJson.spaces2)
    close()
  }

  println(s"number of games: ${getListOfFiles("kif").size}")
  println(s"number of blunders ${blunders.size}")
}