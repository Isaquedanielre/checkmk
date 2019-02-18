checkname = 'vms_cpu'

info = [['1', '99.17', '0.54', '0.18', '0.00']]

discovery = {'': [(None, {})]}

checks = {
    '': [
        (None, None, [
            (0, 'user: 0.54%', [('user', 0.54)]),
            (0, 'system: 0.11%', [('system', 0.10999999999999827)]),
            (0, 'wait: 0.18%', [('wait', 0.18)]),
            (0, 'total cpu: 0.83%', [('util', 0.8299999999999983, None, None, 0, 100)]),
            (0, "100% corresponding to: 1.00 CPU", [('cpu_entitlement', 1)]),
        ]),
        (None, (0.1, 0.5), [
            (0, 'user: 0.54%', [('user', 0.54)]),
            (0, 'system: 0.11%', [('system', 0.10999999999999827)]),
            (1, 'wait: 0.18% (warn/crit at 0.1%/0.5%)', [('wait', 0.18, 0.1, 0.5)]),
            (0, 'total cpu: 0.83%', [('util', 0.8299999999999983, None, None, 0, 100)]),
            (0, "100% corresponding to: 1.00 CPU", [('cpu_entitlement', 1)]),
        ]),
    ],
}