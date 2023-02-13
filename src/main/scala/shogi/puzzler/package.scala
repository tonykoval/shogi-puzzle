package shogi

import io.circe.parser.parse
import shogi.format.Glyph
import shogi.format.forsyth.Sfen
import shogi.format.usi.Usi
import shogi.variant.Standard

import java.io.File
import java.net.{HttpURLConnection, URL}
import scala.io.Source
import java.net.{HttpURLConnection, URL}
import scala.io.Source
import io.circe.generic.auto._
import io.circe.syntax._

package object puzzler {

  case class Drop(role: String, pos: String)

  case class HintOrig(role: String, color: String)

  case class HintDropWrap(orig: HintOrig, dest: String, brush: String = "alternative0", description: String = "")

  case class WrapDrop(drop: Drop, hint: HintDropWrap)

  case class Move(orig: String, dest: String, promotion: Boolean)

  case class HintMoveWrap(orig: String, dest: String, brush: String = "alternative0", description: String = "")

  case class WrapMove(move: Move, hint: HintMoveWrap)

  case class Score(cp: Option[Int] = None, moves: Option[Int] = None)

  case class WrapPiece(drop: Option[WrapDrop] = None, move: Option[WrapMove] = None, score: Option[Score] = None)

  def getArrowColor(engineNum: Option[Int] = None): String = {
    (for (num <- engineNum) yield {
      num match {
        case 1 => "primary"
        case 2 => "alternative1"
        case 3 => "alternative2"
      }
    }) getOrElse "alternative0"
  }

  def getArrowDescription(engineNum: Option[Int] = None): String = {
    (for (num <- engineNum) yield {
      num match {
        case 1 => "1st"
        case 2 => "2nd"
        case 3 => "3rd"
      }
    }) getOrElse "your"
  }

  def getScore(score: Score): Option[String] = {
    (for (x <- score.cp) yield {
      Some(x.toString)
    }) getOrElse (for (x <- score.moves) yield {
      Some(s"#${x}")
    }).flatten
  }

  def getPosition(pos: Pos): String = {
    val mapping = pos.rank.key match {
      case "a" => "1"
      case "b" => "2"
      case "c" => "3"
      case "d" => "4"
      case "e" => "5"
      case "f" => "6"
      case "g" => "7"
      case "h" => "8"
      case "i" => "9"
    }
    pos.file.key + mapping
  }

  def getMove(usi: String, sfen: String): Option[String] = {
    Usi.apply(usi).flatMap {
      case Usi.Drop(role, pos) =>
        Some("drop " + role.toString.toLowerCase() + " " + getPosition(pos))
      case Usi.Move(orig, dest, promotion, _) =>
        Some("move " + (if (promotion) "promote " else "") +
          Sfen(sfen).toBoard(Standard).get(orig).get.role.name.toLowerCase() + " from " +
          getPosition(orig) + " to " +
          getPosition(dest))
    }
  }

  def getPiece(usiMove: String, color: Color, engineNum: Option[Int], score: Option[Score]): Option[WrapPiece] = {
    (for {
      usi <- Usi.apply(usiMove)
    } yield {
      if (usi.positions.size == 1) {
        val drop: Usi.Drop = Usi.Drop(usiMove).get
        Some(
          WrapPiece(
            score = score,
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
                  getArrowColor(engineNum),
                  getArrowDescription(engineNum)
                )
              )
            )
          )
        )
      } else {
        val move = Usi.Move(usiMove).get
        Some(
          WrapPiece(
            score = score,
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
                  getArrowColor(engineNum),
                  getArrowDescription(engineNum)
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

  sealed abstract class Judgement(val glyph: Glyph, val name: String) {
    override def toString: String = name

    def isBlunder: Boolean = this == Judgement.Blunder
  }

  object Judgement {
    object Inaccuracy extends Judgement(Glyph.MoveAssessment.dubious, "Inaccuracy")

    object Mistake extends Judgement(Glyph.MoveAssessment.mistake, "Mistake")

    object Blunder extends Judgement(Glyph.MoveAssessment.blunder, "Blunder")

    val all: Seq[Judgement] = List(Inaccuracy, Mistake, Blunder)
  }

  def getJudgement(comment: String): Option[Judgement] = {
    comment match {
      case x if x.contains(Judgement.Blunder.name) => Some(Judgement.Blunder)
      case x if x.contains(Judgement.Mistake.name) => Some(Judgement.Mistake)
      case x if x.contains(Judgement.Inaccuracy.name) => Some(Judgement.Inaccuracy)
      case _ => None
    }
  }

  case class Position(
                       id: String,
                       sfen: String,
                       hands: String,
                       judgement: String,
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

  def getListOfFiles(dir: String): List[String] = {
    val file = new File(dir)
    file.listFiles.filter(_.isFile)
      .filter(_.getName.endsWith(".kifu"))
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

}