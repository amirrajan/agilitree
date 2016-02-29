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

openBrowser()
url "http://localhost:3000"

"[data-uia-todo]" << "build agile tree"
press enter

"[data-uia-todo]" << "get react scafold in place"
press enter

"[data-uia-todo]" << "es6"
press enter

displayed ".currentlyFocused"

press enter
"[data-uia-todo]" << "life2"
press "j"
press "c"
press "k"
press esc

press enter

reload ()
quit ()
clearCookies ()
clearLocalStorage ()
