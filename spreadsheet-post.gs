/**
 * ============================================================
 * デプロイ手順
 * ============================================================
 *
 * 1. AppsScriptエディタへの貼り付け方法
 *    - Google ドライブ (drive.google.com) を開く
 *    - 「新規」→「その他」→「Google Apps Script」を選択
 *    - エディタが開いたら、デフォルトのコードをすべて削除し
 *      このファイルの内容を貼り付けて保存（Ctrl+S）する
 *
 * 2. ScriptProperties に SPREADSHEET_ID を設定する方法
 *    - エディタ上部メニューの「プロジェクトの設定」（歯車アイコン）を開く
 *    - 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
 *    - プロパティ名: SPREADSHEET_ID
 *      値: 書き込み先スプレッドシートのID
 *        （スプレッドシートのURLの /d/ と /edit の間の文字列）
 *    - 「スクリプト プロパティを保存」をクリック
 *
 * 3. Webアプリとしてデプロイする方法（アクセス権限：全員）
 *    - エディタ右上の「デプロイ」→「新しいデプロイ」をクリック
 *    - 種類の選択で「ウェブアプリ」を選択
 *    - 説明（任意）を入力
 *    - 「次のユーザーとして実行」: 自分（自分のGoogleアカウント）
 *    - 「アクセスできるユーザー」: 全員（Googleアカウント不要を含む）
 *    - 「デプロイ」をクリックし、権限の確認画面で許可する
 *
 * 4. デプロイ後のWebアプリURLの確認方法
 *    - デプロイ完了後に表示されるダイアログの「ウェブアプリ」欄に
 *      URLが表示されるのでコピーして控えておく
 *    - 後から確認する場合は「デプロイ」→「デプロイを管理」から
 *      該当デプロイの「URL」列で確認できる
 *
 * ============================================================
 */

var HEADER = ["日付", "金額", "種別"];

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var json = JSON.parse(e.postData.contents);
    var rows = json.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new Error("rows が空または不正です");
    }

    var sheetName = json.sheetName || "Sheet1";

    var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (!spreadsheetId) {
      throw new Error("SPREADSHEET_ID がスクリプトプロパティに設定されていません");
    }

    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADER);
    } else {
      var firstRow = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0];
      var hasHeader = HEADER.every(function (h, i) { return firstRow[i] === h; });
      if (!hasHeader) {
        sheet.insertRowBefore(1);
        sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
      }
    }

    var data = rows.map(function (row) {
      return [row.date || "", row.amount || 0, row.type || ""];
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, data.length, HEADER.length).setValues(data);

    output.setContent(JSON.stringify({ status: "ok", written: data.length }));
  } catch (err) {
    output.setContent(JSON.stringify({ status: "error", message: err.message }));
  }

  return output;
}
