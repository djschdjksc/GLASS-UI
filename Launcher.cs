using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;

namespace ModernSummaryAppLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                Directory.SetCurrentDirectory(baseDir);

                // 1. Start Print Server if not running on 5005
                if (!IsPortOpen(5005))
                {
                    StartProcess("python", "server\\native_print_server.py");
                }

                // 2. Start SQLite DB Server if not running on 5006
                if (!IsPortOpen(5006))
                {
                    StartProcess("python", "server\\db_server.py");
                }

                // 3. Start Vite dev server if not running on 5173
                if (!IsPortOpen(5173))
                {
                    StartProcess("cmd.exe", "/c npm run dev");
                }

                // 4. Wait for 5173 to become available (up to 15 seconds)
                for (int i = 0; i < 30; i++)
                {
                    if (IsPortOpen(5173)) break;
                    Thread.Sleep(500);
                }

                // 5. Open in dedicated App Mode
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgePath))
                {
                    edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                if (File.Exists(edgePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = "--app=http://localhost:5173 --window-size=1440,900 --start-maximized",
                        UseShellExecute = false
                    };
                    Process.Start(psi);
                }
                else
                {
                    Process.Start("http://localhost:5173");
                }
            }
            catch (Exception ex)
            {
                File.WriteAllText("launcher_error.log", ex.ToString());
            }
        }

        static bool IsPortOpen(int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(350);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        static void StartProcess(string filename, string args)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = filename,
                    Arguments = args,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                Process.Start(psi);
            }
            catch {}
        }
    }
}
