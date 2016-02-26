touch 'chrome_debug.log'
mono nuget.exe install FSharp.Core -ExcludeVersion -OutputDirectory FSharpModules -Version 3.1.2.1
mono nuget.exe install FSharp.Data -ExcludeVersion -OutputDirectory FSharpModules -Version 2.2.3
mono nuget.exe install FSharp.Data.SqlClient -ExcludeVersion -OutputDirectory FSharpModules -Version 1.7.2
mono nuget.exe install Http.fs -ExcludeVersion -OutputDirectory FSharpModules -Version 1.5.1
mono nuget.exe install Newtonsoft.Json -ExcludeVersion -OutputDirectory FSharpModules -Version 6.0.1
mono nuget.exe install UnionArgParser -ExcludeVersion -OutputDirectory FSharpModules -Version 0.8.7
mono nuget.exe install Microsoft.SqlServer.Types -ExcludeVersion -OutputDirectory FSharpModules -Version 11.0.2
mono nuget.exe install canopy -ExcludeVersion -OutputDirectory FSharpModules -Version 0.9.29
mono nuget.exe install Newtonsoft.Json -ExcludeVersion -OutputDirectory FSharpModules -Version 6.0.1
mono nuget.exe install Http.fs -ExcludeVersion -OutputDirectory FSharpModules -Version 1.5.1
mono nuget.exe install FAKE -ExcludeVersion -OutputDirectory FSharpModules -Version 4.3.1
