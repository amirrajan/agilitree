#I "./FSharpModules/UnionArgParser/lib/net40"
#I "./FSharpModules/Microsoft.SqlServer.Types/lib/net20"
#I "./FSharpModules/FSharp.Data/lib/net40"
#I "./FSharpModules/FSharp.Data.SqlClient/lib/net40"
#I "./FSharpModules/Http.fs/lib/net40"
#I "./FSharpModules/Selenium.WebDriver/lib/net40"
#I "./FSharpModules/Selenium.Support/lib/net40"
#I "./FSharpModules/SizSelCsZzz/lib"
#I "./Fsharpmodules/Newtonsoft.Json/lib/net40"
#I "./FSharpModules/canopy/lib"
#I "./FsharpModules/Http.fs/lib/net40"

#r "UnionArgParser.dll"
#r "Microsoft.SqlServer.Types.dll"
#r "FSharp.Data.SqlClient.dll"
#r "HttpClient.dll"
#r "WebDriver.dll"
#r "WebDriver.Support.dll"
#r "HttpClient.dll"
#r "canopy.dll"
#r "System.Core.dll"
#r "System.Xml.Linq.dll"
#r "FSharp.Data.dll"

open HttpClient
open canopy
open runner
open System
open FSharp.Data
open Nessos.UnionArgParser
open types
open reporters
open configuration
open OpenQA.Selenium.Firefox
open OpenQA.Selenium
open OpenQA.Selenium.Support.UI
open OpenQA.Selenium.Interactions
open System.Collections.ObjectModel

let exists selector =
  let e = someElement selector
  match e with
    | Some(e) -> true
    | _ -> false

let clearCookies _ =
    browser.Manage().Cookies.DeleteAllCookies()

let clearLocalStorage _ =
  (js """window.localStorage['logs'] = null;""") |> ignore
  ()

let openBrowser _ =
  configuration.chromeDir <- "./"
  let options = Chrome.ChromeOptions()
  options.AddArgument("--enable-logging")
  options.AddArgument("--v=0")
  start (ChromeWithOptions options)
  clearCookies ()

let ids _ =
  (js """
        return $('[id]').map(function(a) {
            return $($('[id]')[a]).attr('id');
        })
      """) :?> ReadOnlyCollection<System.Object> |> List.ofSeq

let names _ =
  (js """
        return $('[name]').map(function(a) {
            return $($('[name]')[a]).attr('name');
        })
      """) :?> ReadOnlyCollection<System.Object> |> List.ofSeq

let esc = OpenQA.Selenium.Keys.Escape

let beforeTest _ =
  clearLocalStorage ()
  reload ()
  ()

let test_suite _ =
  canopy.configuration.compareTimeout <- 0.5
  canopy.configuration.elementTimeout <- 0.5
  canopy.configuration.pageTimeout <- 0.5

  let updating_works _ =
    press "c"
    "[data-uia-todo]" << "life2"
    press esc
    "[data-uia='tree']" =~ "life2"

  let adding_works _ =
    press "j"
    press "c"
    "[data-uia-todo]" << "life3"
    press esc

    press "j"
    press "c"
    "[data-uia-todo]" << "life4"
    press esc

    "[data-uia='tree']" =~ "root"
    "[data-uia='tree']" =~ "life3"
    "[data-uia='tree']" =~ "life4"

  let add_above_works _ =
    press "k"
    press "c"
    "[data-uia-todo]" << "life3"
    press esc
    "[data-uia='tree']" == "life3\nroot"

  let deleting_works _ =
    press "j"
    press "c"
    "[data-uia-todo]" << "life3"
    press esc
    press "x"
    "[data-uia='tree']" == "root"

  let local_storage_works _ =
    press "c"
    "[data-uia-todo]" << "life3"
    press esc
    reload ()
    "[data-uia='tree']" == "life3"

  let o_and_O_works _ =
    press "o"
    "[data-uia-todo]" << "life3"
    press esc
    press "k"
    press "O"
    "[data-uia-todo]" << "life1"
    press esc
    "[data-uia='tree']" == "life1\nroot\nlife3"

  beforeTest ()
  updating_works ()

  beforeTest ()
  adding_works ()

  beforeTest ()
  add_above_works ()

  beforeTest ()
  deleting_works ()

  beforeTest ()
  local_storage_works ()

  beforeTest ()
  o_and_O_works ()

let go _ =
  openBrowser()
  url "http://localhost:3000"
  test_suite ()

go ()
quit ()
